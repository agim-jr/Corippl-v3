// frontend/src/lib/api.js

import { useCallback, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext"; // Adjust the path if necessary
import { toast } from "react-toastify"; // Optional: For toast notifications

// ✅ Use environment variable instead of hardcoded URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export { BASE_URL };

export const useApi = () => {
  const { logout, token } = useContext(AuthContext); // ✅ Get token from AuthContext

  const apiFetch = useCallback(
    async (url, options = {}) => {
      // Add debugging information
      console.log(`API Request: ${options.method || "GET"} ${url}`);

      const headers = options.headers || {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn(
          "No auth token found. Some API endpoints may be inaccessible.",
        );
      }

      // Merge any existing headers with the Authorization header
      const config = {
        ...options,
        headers: {
          ...headers,
        },
      };

      try {
        // Prepend the BASE_URL to the endpoint
        console.log(`Making fetch request to: ${BASE_URL}${url}`);
        const response = await fetch(`${BASE_URL}${url}`, config);
        console.log(`API Response status: ${response.status} for ${url}`);

        if (response.status === 401) {
          // Unauthorized - Token might be expired or invalid
          toast.warn("Session expired. Please log in again.");
          logout(); // Trigger logout to clear auth state and redirect
          const error = new Error("Session expired. Please log in again.");
          error.status = 401;
          throw error;
        }

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const error = new Error(
              "Too many requests. Please try again later.",
            );
            error.status = 429;
            error.isRateLimit = true;
            toast.warn("Too many requests. Please try again later.");
            throw error;
          }

          // Attempt to parse error message from response
          try {
            const errorData = await response.json();
            console.error("API Error data:", errorData);
            const error = new Error(errorData.detail || "API Fetch Error");
            error.status = response.status;
            error.details = errorData;
            throw error;
          } catch (jsonError) {
            console.error("Failed to parse error response:", jsonError);
            const error = new Error(
              `API Fetch Error: ${response.status} ${response.statusText}`,
            );
            error.status = response.status;
            throw error;
          }
        }

        return response;
      } catch (error) {
        console.error(`API Fetch Error for ${url}:`, error);
        throw error;
      }
    },
    [logout, token],
  );
  /**
   * Comprehensive search functionality for premium users.
   * @param {Object} params - Search parameters.
   * @param {string} params.query - Search query.
   * @param {string[]} [params.content_type] - Array of content types to filter.
   * @param {string[]} [params.categories] - Array of categories to filter.
   * @param {string} [params.date_from] - Start date in YYYY-MM-DD.
   * @param {string} [params.date_to] - End date in YYYY-MM-DD.
   * @param {number} [params.min_views] - Minimum number of views.
   * @param {string} [params.sort_by] - Sort by 'relevance', 'date', or 'views'.
   */
  const searchContent = useCallback(
    async (params) => {
      const {
        query,
        content_type,
        categories,
        date_from,
        date_to,
        min_views,
        sort_by,
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append("query", query);

      if (content_type && content_type.length > 0) {
        content_type.forEach((ct) => queryParams.append("content_type", ct));
      }

      if (categories && categories.length > 0) {
        categories.forEach((cat) => queryParams.append("categories", cat));
      }

      if (date_from) {
        queryParams.append("date_from", date_from);
      }

      if (date_to) {
        queryParams.append("date_to", date_to);
      }

      if (min_views !== undefined && min_views !== null) {
        queryParams.append("min_views", min_views);
      }

      if (sort_by) {
        queryParams.append("sort_by", sort_by);
      }

      const url = `/search/?${queryParams.toString()}`;

      const response = await apiFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data; // Expected to be an array of ContentResponse
    },
    [apiFetch],
  );

  const getUserSubmissionInfo = useCallback(async () => {
    const response = await apiFetch("/api/users/submission-info", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // { weekly_submission_count, last_submission_date, can_submit, submissions_remaining }
  }, [apiFetch]);

  // ✅ ADD THIS NEW FUNCTION
  const getUserShareInfo = useCallback(async () => {
    const response = await apiFetch("/api/users/share-info", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // { daily_share_count, shares_remaining, is_premium, last_share_date }
  }, [apiFetch]);

  const getProfile = useCallback(
    async (userId) => {
      const response = await apiFetch(`/profiles/${userId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  const updateProfile = useCallback(
    async (userId, profileData) => {
      const response = await apiFetch(`/profiles/${userId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  const getContents = useCallback(async () => {
    const response = await apiFetch(`/content/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // Expected to be an array of ContentResponse
  }, [apiFetch]);

  /**
   * Submit new content.
   * @param {Object} contentData - The data of the content to submit.
   */
  const submitContent = useCallback(
    async (contentData) => {
      const formData = new FormData();
      formData.append("title", contentData.title);
      if (contentData.description)
        formData.append("description", contentData.description);
      formData.append("url", contentData.url);
      formData.append("content_type", contentData.content_type);
      formData.append("required_shares", contentData.required_shares || 5);
      formData.append(
        "categories",
        JSON.stringify(contentData.categories || []),
      );

      // ✅ ADD THIS LINE to include media_url
      if (contentData.media_url) {
        formData.append("media_url", contentData.media_url);
      }

      const response = await apiFetch(`/content/`, {
        method: "POST",
        // ✅ Don't set Content-Type - browser sets it automatically for FormData
        body: formData,
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  // Modify getMatchedContent to accept content type filter
  // Modify getMatchedContent to handle type issues properly
  const getMatchedContent = useCallback(
    async (
      rankedContent = false,
      topPerformers = false,
      contentTypeFilter = null,
    ) => {
      const queryParams = new URLSearchParams();
      if (rankedContent) queryParams.append("ranked_content", "true");
      if (topPerformers) queryParams.append("top_performers", "true");

      const urlWithParams = `/content/match?${queryParams.toString()}`;

      const response = await apiFetch(urlWithParams, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      // If contentTypeFilter is provided, filter the results client-side
      // but with proper type checking
      if (
        contentTypeFilter &&
        typeof contentTypeFilter === "string" &&
        Array.isArray(data)
      ) {
        const filterLowerCase = contentTypeFilter.toLowerCase();
        return data.filter(
          (content) =>
            content.content_type &&
            typeof content.content_type === "string" &&
            content.content_type.toLowerCase() === filterLowerCase,
        );
      }

      return data; // Expected to be an array of ContentResponse including categories
    },
    [apiFetch],
  );

  const shareContent = useCallback(
    async (contentId, contactIds = [], userContentId = null) => {
      try {
        console.log("📡 API - shareContent called:", {
          contentId,
          contactIds,
          userContentId,
        });

        const response = await apiFetch(`/api/share/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matched_content_id: contentId,
            user_content_id: userContentId,
            contact_ids: contactIds,
          }),
        });

        const data = await response.json();
        console.log("✅ API - shareContent response:", data);

        // ✅ FIX: Return the full data object, not just user_content
        // The response structure is:
        // {
        //   success: true,
        //   message: "...",
        //   share_details: {...},
        //   credits: {...},
        //   unlock_result: {...}
        // }
        return { data }; // Wrap in { data } to match Axios-like structure
      } catch (error) {
        console.error("❌ API - shareContent error:", error);

        if (error.status) {
          const enhancedError = new Error(error.message);
          enhancedError.status = error.status;
          throw enhancedError;
        }
        throw error;
      }
    },
    [apiFetch],
  );

  const editContent = useCallback(
    async (contentId, contentData) => {
      console.log("🔍 API - editContent called with:", {
        contentId,
        contentData,
      });

      const response = await apiFetch(`/content/${contentId}`, {
        // ✅ REMOVED trailing slash
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentData),
      });

      const updatedContent = await response.json();
      console.log("🔍 API - editContent response:", updatedContent);
      return updatedContent;
    },
    [apiFetch],
  );

  const deleteContent = useCallback(
    async (contentId) => {
      await apiFetch(`/content/${contentId}/`, {
        method: "DELETE",
      });
      return true;
    },
    [apiFetch],
  );

  /**
   * Toggle auto-share status for a specific content item.
   * @param {number} contentId - The ID of the content.
   * @param {boolean} autoShare - Whether to enable or disable auto-share.
   */
  const toggleContentAutoShare = useCallback(
    async (contentId, autoShare) => {
      const response = await apiFetch(`/content/${contentId}/auto-share`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auto_share: autoShare }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  // Contact-related API functions

  const createContact = useCallback(
    async (contactData) => {
      const response = await apiFetch(`/contacts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });
      const data = await response.json();
      return data; // The newly created ContactResponse
    },
    [apiFetch],
  );

  const bulkCreateContacts = useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch(`/contacts/bulk`, {
        method: "POST",
        headers: {
          // "Content-Type" is automatically set to multipart/form-data
          // No need to set it manually
        },
        body: formData,
      });
      const data = await response.json();
      return data; // Array of ContactResponse
    },
    [apiFetch],
  );

  // In frontend/src/lib/api.js
  // Add this after the existing contact functions (around line 280-300)

  /**
   * Bulk update quality scores for multiple contacts.
   * @param {Object} ratings - Object with contact IDs as keys and ratings as values.
   * @returns {Promise<Object>} - Updated contacts information.
   */
  const bulkRateContacts = useCallback(
    async (ratings) => {
      const response = await apiFetch("/contacts/bulk-rate", {
        // ✅ Changed from /api/contacts/bulk-rate
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ratings }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  const fetchContacts = useCallback(async () => {
    const response = await apiFetch(`/contacts/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data.contacts;
  }, [apiFetch]);

  const deleteContact = useCallback(
    async (contactId) => {
      await apiFetch(`/contacts/${contactId}/`, {
        method: "DELETE",
      });
      return true;
    },
    [apiFetch],
  );

  // Add this inside your useApi hook in frontend/src/lib/api.js

  const getContentTypes = useCallback(async () => {
    const response = await apiFetch(`/content/types`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // Expected to be an array of strings (content types)
  }, [apiFetch]);

  /**
   * Fetch detailed information for a specific content item.
   * @param {number} contentId - The ID of the content to fetch.
   */
  const getContentDetails = useCallback(
    async (contentId) => {
      const response = await apiFetch(`/content/${contentId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Fetch analytics data for specific content items.
   * @param {number[]} contentIds - Array of content IDs.
   */
  const getContentAnalytics = useCallback(
    async (contentIds) => {
      const response = await apiFetch(`/analytics/`, {
        // Corrected endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content_ids: contentIds }),
      });
      const data = await response.json();
      return data; // Expected to be an object with content IDs as keys
    },
    [apiFetch],
  );

  // Analytics-related API functions

  const getUserAnalytics = useCallback(
    async (userId) => {
      const response = await apiFetch(`/analytics/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data; // Expected to be UserAnalyticsSchema
    },
    [apiFetch],
  );

  // --- New Flagging API Functions ---

  /**
   * Flag a specific content item.
   * @param {number} contentId - The ID of the content to flag.
   * @param {string} reason - The reason for flagging the content.
   */
  const flagContent = useCallback(
    async (contentId, reason) => {
      const response = await apiFetch(`/flags/`, {
        // Changed endpoint path
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content_id: contentId, reason }), // Include content_id
      });
      const data = await response.json();
      return data; // FlagResponse
    },
    [apiFetch],
  );

  /**
   * Retrieve all flagged content (Admin only).
   */
  const getFlags = useCallback(async () => {
    const response = await apiFetch(`/flags/`, {
      // Changed endpoint path
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // Array of FlagResponse
  }, [apiFetch]);

  /**
   * Delete a specific flag by its ID.
   * @param {number} flagId - The ID of the flag to delete.
   */
  const deleteFlag = useCallback(
    async (flagId) => {
      await apiFetch(`/flags/${flagId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    },
    [apiFetch],
  );

  /**
   * Bulk delete flags by their IDs.
   * @param {number[]} flagIds - Array of flag IDs to delete.
   */
  const bulkDeleteFlags = useCallback(
    async (flagIds) => {
      const response = await apiFetch(`/flags/bulk-delete`, {
        method: "POST", // Assuming POST for bulk delete with body
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flag_ids: flagIds }),
      });
      const data = await response.json();
      return data; // Success message or list of deleted flags
    },
    [apiFetch],
  );

  const adminDeleteContent = useCallback(
    async (contentId) => {
      await apiFetch(`/admin/content/${contentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    },
    [apiFetch],
  );

  /**
   * Retrieve all notifications for the current user.
   */
  const getNotifications = useCallback(async () => {
    const response = await apiFetch(`/notifications/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // Array of Notification objects
  }, [apiFetch]);

  /**
   * Mark a specific notification as read.
   * @param {number} notificationId - The ID of the notification to mark as read.
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      const response = await apiFetch(`/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data; // Updated Notification object
    },
    [apiFetch],
  );

  /**
   * Update the status of a specific content item associated with a flag.
   * @param {number} flagId - The ID of the flag.
   * @param {string} newStatus - The new status to set (e.g., "approved").
   */
  const updateContentStatus = useCallback(
    async (flagId, newStatus) => {
      const response = await apiFetch(`/flags/${flagId}/content-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_status: newStatus }), // Ensure the key matches the backend
      });
      const data = await response.json();
      return data; // ContentResponse
    },
    [apiFetch],
  );

  const requestPasswordReset = useCallback(
    async (email) => {
      const response = await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  const resetPassword = useCallback(
    async (token, new_password) => {
      const response = await apiFetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  const updatePassword = useCallback(
    async (current_password, new_password) => {
      const response = await apiFetch("/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ current_password, new_password }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Create a short link for a given content ID. Premium users only.
   * @param {number} contentId
   */
  const createShortLink = useCallback(
    async (contentId) => {
      const response = await apiFetch(`/links/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content_id: contentId }),
      });
      const data = await response.json();
      return data; // LinkResponse
    },
    [apiFetch],
  );

  /**
   * Create a trackable link for a specific content item.
   * @param {number} contentId - The ID of the content.
   */
  const enhanceLink = useCallback(
    async (contentId) => {
      const response = await apiFetch(
        `/content/${contentId}/create-trackable-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Shuffle and retrieve new content matches.
   */
  const shuffleMatches = useCallback(async () => {
    try {
      const response = await apiFetch(`/content/shuffle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json(); // Array of ContentResponse
      return data; // Can be an empty array
    } catch (error) {
      throw error; // Let the calling function handle the error
    }
  }, [apiFetch]);

  /**
   * Get remaining shuffles for the day.
   */
  const getRemainingShuffles = useCallback(async () => {
    const response = await apiFetch(`/content/shuffles/remaining`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json(); // { remaining_shuffles: int or "Unlimited" }
    return data;
  }, [apiFetch]);

  // Add these lines after existing API functions

  /**
   * Record a new conversion event.
   * @param {Object} conversionData - The data of the conversion event.
   */
  const recordConversion = useCallback(
    async (conversionData) => {
      const response = await apiFetch(`/conversions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conversionData),
      });
      const data = await response.json();
      return data; // ConversionResponse
    },
    [apiFetch],
  );

  /**
   * Retrieve all conversion events (Admin only).
   */
  const getAllConversions = useCallback(async () => {
    const response = await apiFetch(`/conversions/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // Array of ConversionResponse
  }, [apiFetch]);

  /**
   * Retrieve conversion metrics for specific content IDs (Admin only).
   * @param {number[]} contentIds - Array of content IDs.
   */
  const getConversionMetrics = useCallback(
    async (contentIds) => {
      const response = await apiFetch(`/conversions/content/metrics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Assuming the backend expects content IDs as query parameters
        // Modify as per your backend implementation
        body: JSON.stringify({ content_ids: contentIds }),
      });
      const data = await response.json();
      return data; // { [contentId]: { conversionType: count, ... }, ... }
    },
    [apiFetch],
  );

  // Add these lines after existing API functions

  /**
   * Retrieve audience data for a specific user (Admin only).
   * @param {number} userId - The ID of the user.
   */
  const getAudience = useCallback(
    async (userId) => {
      const response = await apiFetch(`/audience/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data; // AudienceResponse
    },
    [apiFetch],
  );

  /**
   * Create or update audience data for the current user.
   * @param {Object} audienceData - The audience data to create or update.
   */
  const createOrUpdateAudience = useCallback(
    async (audienceData) => {
      const response = await apiFetch(`/audience/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(audienceData),
      });
      const data = await response.json();
      return data; // AudienceResponse
    },
    [apiFetch],
  );

  /**
   * Update audience data for a specific user (Admin only).
   * @param {number} userId - The ID of the user.
   * @param {Object} audienceUpdate - The audience data to update.
   */
  const updateAudience = useCallback(
    async (userId, audienceUpdate) => {
      const response = await apiFetch(`/audience/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(audienceUpdate),
      });
      const data = await response.json();
      return data; // AudienceResponse
    },
    [apiFetch],
  );

  /**
   * Delete audience data for a specific user (Admin only).
   * @param {number} userId - The ID of the user.
   */
  const deleteAudience = useCallback(
    async (userId) => {
      await apiFetch(`/audience/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    },
    [apiFetch],
  );

  /**
   * List all audience data (Admin only).
   */
  const listAllAudiences = useCallback(async () => {
    const response = await apiFetch(`/audience/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data; // Array of AudienceResponse
  }, [apiFetch]);

  /**
   * Create a Stripe Checkout Session with plan and billing options.
   * @param {Object} options - Checkout options
   * @param {string} options.plan_type - "premium" or "ai"
   * @param {string} options.billing_cycle - "monthly" or "annual"
   */
  const createCheckoutSession = useCallback(
    async ({ plan_type = "premium", billing_cycle = "monthly" } = {}) => {
      console.log("📍 API - createCheckoutSession called with:", {
        plan_type,
        billing_cycle,
      });

      const response = await apiFetch(
        "/api/subscription/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_type: plan_type,
            billing_cycle: billing_cycle,
          }),
        },
      );
      const data = await response.json();
      console.log("📍 API - createCheckoutSession response:", data);
      return data; // Expected format: { checkout_session_id: string, plan_type: string, billing_cycle: string }
    },
    [apiFetch],
  );

  /**
   * Create a Stripe Checkout Session specifically for AI Enhanced plan.
   * @param {string} billingCycle - "monthly" or "annual"
   */
  const createAICheckoutSession = useCallback(
    async (billingCycle = "monthly") => {
      const response = await apiFetch(
        `/api/subscription/create-ai-checkout-session?billing_cycle=${billingCycle}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data; // Expected format: { checkout_session_id: string, plan_type: "ai", billing_cycle: string }
    },
    [apiFetch],
  );

  // Add these functions to your useApi hook in frontend/src/lib/api.js

  /**
   * Get the user's email preferences.
   * @returns {Promise<Object>} - User's email preferences.
   */
  const getUserEmailPreferences = useCallback(async () => {
    const response = await apiFetch("/api/preferences/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Update the user's email preferences.
   * @param {Object} preferences - The email preferences to update.
   * @returns {Promise<Object>} - Updated email preferences.
   */
  const updateUserEmailPreferences = useCallback(
    async (preferences) => {
      const response = await apiFetch("/api/preferences/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Toggle AI autopilot mode on or off.
   * @param {boolean} enabled - Whether to enable or disable autopilot.
   */
  const toggleAutopilot = useCallback(
    async (enabled) => {
      const response = await apiFetch("/api/ai/autopilot/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Upgrade user to AI tier.
   */
  const upgradeToAITier = useCallback(async () => {
    const response = await apiFetch("/api/subscription/upgrade-ai-tier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Downgrade user from AI tier.
   */
  const downgradeFromAITier = useCallback(async () => {
    const response = await apiFetch("/api/subscription/downgrade-ai-tier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  // Reciprocal AI API Functions - Add these

  /**
   * Get current reciprocal balance (give vs receive).
   */
  const getReciprocalBalance = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/balance", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get immediate reciprocal opportunities (share this to unlock that).
   */
  const getReciprocalOpportunities = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/opportunities", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Find reciprocal partners for mutual content sharing.
   */
  const getReciprocalMatches = useCallback(
    async (limit = 10) => {
      const response = await apiFetch(
        `/api/reciprocal-ai/matches?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Trigger AI to automatically share others' content to unlock yours.
   */
  const triggerAutoReciprocalShare = useCallback(
    async (maxShares = 3) => {
      const response = await apiFetch("/api/reciprocal-ai/auto-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ max_shares: maxShares }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get recent reciprocal activity (what you've given and received).
   */
  const getReciprocalActivity = useCallback(
    async (days = 7) => {
      const response = await apiFetch(
        `/api/reciprocal-ai/activity?days=${days}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get queue automation status and AI's unlock plan.
   */
  const getQueueAutomationStatus = useCallback(async () => {
    const response = await apiFetch("/content/queue/status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get AI efficiency metrics (time saved through automation).
   */
  const getAIEfficiencyMetrics = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/efficiency-metrics", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Toggle reciprocal autopilot mode.
   */
  const toggleReciprocalAutopilot = useCallback(
    async (enabled) => {
      const response = await apiFetch("/api/reciprocal-ai/autopilot/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Update reciprocal autopilot settings.
   */
  const updateReciprocalAutopilotSettings = useCallback(
    async (settings) => {
      console.log("🔍 Received settings in API function:", settings);

      // Settings are already in backend format, use them directly
      const response = await apiFetch("/api/reciprocal-ai/autopilot/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings), // ← Use settings directly!
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get comprehensive reciprocal dashboard statistics.
   */
  const getReciprocalDashboardStats = useCallback(async () => {
    try {
      const response = await apiFetch("/api/reciprocal-ai/dashboard-stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching reciprocal dashboard stats:", error);
      throw error;
    }
  }, [apiFetch]);

  /**
   * Check reciprocal AI health status.
   */
  const getReciprocalAIHealthCheck = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/health-check", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Analyze content shareability for reciprocal relationships.
   */
  const analyzeContentShareability = useCallback(
    async (contentId) => {
      const response = await apiFetch(
        `/api/reciprocal-ai/analyze-shareability/${contentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  // ADD THESE NEW ML API FUNCTIONS (after existing functions)

  /**
   * Get ML-powered sharing prediction for content.
   */
  const predictContentSharing = useCallback(
    async (contentId) => {
      const response = await apiFetch(
        `/api/reciprocal-ai/predict-sharing/${contentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get saved ML prediction for content.
   */
  const getSavedMLPrediction = useCallback(
    async (contentId) => {
      const response = await apiFetch(`/api/ai/predictions/${contentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get comprehensive AI insights (analysis + ML prediction).
   */
  const getContentAIInsights = useCallback(
    async (contentId) => {
      const response = await apiFetch(
        `/api/ai/content/${contentId}/ai-insights`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get detailed ML insights for content optimization.
   */
  const getMLInsights = useCallback(
    async (contentId) => {
      const response = await apiFetch(
        `/api/reciprocal-ai/ml-insights/${contentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Retrain ML models with latest data (admin only).
   */
  const retrainMLModels = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/retrain-models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get current reciprocal autopilot settings.
   */
  const getReciprocalAutopilotSettings = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/autopilot/settings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  // Add these to your useApi hook in frontend/src/lib/api.js

  // AI Contact Recommendation API Functions
  const getAIContactRecommendations = useCallback(
    async (contentId, limit = 10) => {
      const response = await apiFetch(
        `/api/ai-contact-recommendations/for-content/${contentId}?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  const getAIContactInsights = useCallback(async () => {
    const response = await apiFetch(
      "/api/ai-contact-recommendations/insights",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const data = await response.json();
    return data;
  }, [apiFetch]);

  const updateAllAIContactScores = useCallback(async () => {
    const response = await apiFetch(
      "/api/ai-contact-recommendations/update-scores",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const data = await response.json();
    return data;
  }, [apiFetch]);

  // ✅ NEW: A/B Testing API Functions
  const getABTestResults = useCallback(async () => {
    const response = await apiFetch("/api/reciprocal-ai/ab-test-results", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  const acknowledgeQueueAlert = useCallback(async () => {
    const response = await apiFetch(
      "/api/reciprocal-ai/acknowledge-queue-alert",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Authenticate with Google OAuth token
   * @param {string} googleToken - The Google ID token from the frontend
   */
  const loginWithGoogle = useCallback(
    async (googleToken) => {
      const response = await apiFetch("/auth/google/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: googleToken }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );
  /**
   * Upload media file for content.
   * @param {File} file - The media file to upload
   * @param {string} contentType - Type of content (image, video, audio, document)
   * @returns {Promise<Object>} - Upload result with media_url
   */
  const uploadMedia = useCallback(
    async (file, contentType = "image") => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("content_type", contentType);

      const response = await apiFetch("/media/upload", {
        method: "POST",
        // Don't set Content-Type header - browser sets it automatically for FormData
        body: formData,
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Delete media file.
   * @param {string} mediaUrl - The S3 URL or key of the media to delete
   */
  const deleteMedia = useCallback(
    async (mediaUrl) => {
      const response = await apiFetch("/media/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ media_url: mediaUrl }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Check media service health.
   */
  const getMediaHealthCheck = useCallback(async () => {
    const response = await apiFetch("/media/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get comprehensive user progress metrics for the Progress Widget.
   */
  const getUserProgress = useCallback(async () => {
    const response = await apiFetch("/api/users/progress", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  // Add these to frontend/src/lib/api.js after your existing functions

  // ==================== POOL API FUNCTIONS ====================

  /**
   * Get user's pool credits balance.
   */
  const getPoolCredits = useCallback(async () => {
    const response = await apiFetch("/pool/credits", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get content queue for review (pending content).
   */
  const getPoolQueue = useCallback(async () => {
    const response = await apiFetch("/pool/queue", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Submit content to the Pool (costs 20 credits).
   * @param {Object} poolData - Pool submission data
   */
  const submitToPool = useCallback(
    async (poolData) => {
      try {
        console.log("🔍 API submitToPool - Request data:", poolData);

        const response = await apiFetch("/pool/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(poolData),
        });

        const data = await response.json();
        console.log("✅ API submitToPool - Response:", data);
        return data;
      } catch (error) {
        console.error("❌ API submitToPool - Error:", error);
        throw error;
      }
    },
    [apiFetch],
  );

  /**
   * Submit a review for pool content (earn 5 credits).
   * @param {Object} reviewData - Review data (content_id, rating, feedback, etc.)
   */
  const submitPoolReview = useCallback(
    async (reviewData) => {
      const response = await apiFetch("/pool/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get user's submitted pool content.
   */
  const getMyPoolSubmissions = useCallback(async () => {
    const response = await apiFetch("/pool/my-submissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get pool performance stats.
   */
  const getPoolStats = useCallback(async () => {
    const response = await apiFetch("/pool/stats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get collaboration matches from the pool.
   */
  const getCollaborationMatches = useCallback(
    async (limit = 10) => {
      const response = await apiFetch(
        `/pool/collaboration-matches?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get genesis metrics for Audience Genesis dashboard.
   */
  const getGenesisMetrics = useCallback(async () => {
    const response = await apiFetch("/pool/genesis-metrics", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Send a message to a creator
   */
  const sendMessageToCreator = useCallback(
    async (userId, message) => {
      const response = await apiFetch(`/pool/message/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Follow a creator
   */
  const followCreator = useCallback(
    async (userId) => {
      const response = await apiFetch(`/pool/follow/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get Quick Connect request board
   */
  const getQuickConnectBoard = useCallback(
    async (
      category = null,
      urgency = null,
      minTokens = null,
      preview = false,
    ) => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (urgency) params.append("urgency", urgency);
      if (minTokens) params.append("min_tokens", minTokens);
      if (preview) params.append("preview", "true"); // ✅ ADD THIS LINE

      const response = await apiFetch(
        `/quick-connects/board?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Create a new Quick Connect request
   */
  const createQuickConnectRequest = useCallback(
    async (requestData) => {
      const response = await apiFetch("/quick-connects/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Offer help for a request
   */
  const offerQuickConnectHelp = useCallback(
    async (helpData) => {
      const response = await apiFetch("/quick-connects/help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(helpData),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get user's posted requests
   * @param {boolean} preview - Whether this is a preview mode request (free tier)
   */
  const getMyQuickConnectRequests = useCallback(
    async (preview = false) => {
      const params = new URLSearchParams();
      if (preview) params.append("preview", "true");

      const response = await apiFetch(
        `/quick-connects/my-requests?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get help offers user has given
   */
  const getMyHelpGiven = useCallback(
    async (preview = false) => {
      const params = new URLSearchParams();
      if (preview) params.append("preview", "true"); // ✅ ADD THIS

      const response = await apiFetch(
        `/quick-connects/my-help-given?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get user's token balance
   */
  const getQuickConnectTokens = useCallback(async () => {
    const response = await apiFetch("/quick-connects/tokens", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get leaderboard of top helpers
   */
  const getQuickConnectLeaderboard = useCallback(
    async (limit = 10) => {
      const response = await apiFetch(
        `/quick-connects/leaderboard?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  // ==================== MESSAGING API FUNCTIONS ====================

  /**
   * Send a direct message to another user.
   * @param {number} userId - Recipient user ID
   * @param {string} message - Message content
   */
  const sendMessage = useCallback(
    async (userId, message) => {
      const response = await apiFetch(`/pool/message/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get all conversations with unread counts.
   */
  const getAllConversations = useCallback(async () => {
    const response = await apiFetch("/pool/messages/conversations", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get message thread with a specific user.
   * @param {number} userId - Other user's ID
   * @param {number} limit - Number of messages to fetch
   * @param {number} offset - Pagination offset
   */
  const getConversation = useCallback(
    async (userId, limit = 50, offset = 0) => {
      const response = await apiFetch(
        `/pool/messages/${userId}?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Mark a specific message as read.
   * @param {number} messageId - Message ID to mark as read
   */
  const markMessageAsRead = useCallback(
    async (messageId) => {
      const response = await apiFetch(`/pool/messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  // ==================== FOLLOWING API FUNCTIONS ====================

  /**
   * Follow a user.
   * @param {number} userId - User ID to follow
   */
  const followUser = useCallback(
    async (userId) => {
      const response = await apiFetch(`/pool/follow/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Unfollow a user.
   * @param {number} userId - User ID to unfollow
   */
  const unfollowUser = useCallback(
    async (userId) => {
      const response = await apiFetch(`/pool/follow/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get follow status with a specific user.
   * @param {number} userId - User ID to check status with
   */
  const getFollowStatus = useCallback(
    async (userId) => {
      const response = await apiFetch(`/pool/follow/status/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get list of users current user is following.
   * @param {number} limit - Number of follows to fetch
   * @param {number} offset - Pagination offset
   */
  const getFollowingList = useCallback(
    async (limit = 50, offset = 0) => {
      const response = await apiFetch(
        `/pool/following?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get list of current user's followers.
   * @param {number} limit - Number of followers to fetch
   * @param {number} offset - Pagination offset
   */
  const getFollowersList = useCallback(
    async (limit = 50, offset = 0) => {
      const response = await apiFetch(
        `/pool/followers?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get follow statistics for current user.
   */
  const getFollowStats = useCallback(async () => {
    const response = await apiFetch("/pool/follow/stats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  /**
   * Get AI-suggested helpers for a specific request (requester only).
   * @param {number} requestId - The request ID
   * @param {number} maxSuggestions - Max number of suggestions
   */
  const suggestQuickConnectHelpers = useCallback(
    async (requestId, maxSuggestions = 5) => {
      const response = await apiFetch(
        `/quick-connects/ml/suggest-helpers/${requestId}?max_suggestions=${maxSuggestions}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Accept a help offer (requester only).
   * @param {number} helpId - The help offer ID
   */
  const acceptQuickConnectHelp = useCallback(
    async (helpId) => {
      const response = await apiFetch(`/quick-connects/help/${helpId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Rate completed help (requester only).
   * @param {Object} ratingData - Rating data
   */
  const rateQuickConnectHelp = useCallback(
    async (ratingData) => {
      const response = await apiFetch("/quick-connects/help/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ratingData),
      });
      const data = await response.json();
      return data;
    },
    [apiFetch],
  );

  /**
   * Get current user's profile/info.
   */
  const getCurrentUser = useCallback(async () => {
    const response = await apiFetch("/api/users/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }, [apiFetch]);

  return {
    apiFetch,
    getUserSubmissionInfo,
    getUserShareInfo,
    getProfile,
    updateProfile,
    getContents,
    submitContent,
    getMatchedContent,
    searchContent,
    shareContent,
    editContent,
    deleteContent,
    toggleContentAutoShare, // ✅ ADD THIS LINE HERE
    getContentDetails,
    getContentAnalytics,
    getContentTypes,
    getUserAnalytics,
    createContact,
    bulkCreateContacts,
    bulkRateContacts, // ✅ ADD THIS LINE
    fetchContacts,
    deleteContact,
    flagContent,
    getFlags,
    deleteFlag,
    bulkDeleteFlags,
    getNotifications,
    markAsRead,
    updateContentStatus,
    requestPasswordReset,
    resetPassword,
    updatePassword,
    createShortLink,
    enhanceLink,
    adminDeleteContent,
    shuffleMatches,
    getRemainingShuffles,
    // Newly added functions
    recordConversion,
    getAllConversions,
    getConversionMetrics,
    getAudience,
    createOrUpdateAudience,
    updateAudience,
    deleteAudience,
    listAllAudiences,
    createCheckoutSession,
    createAICheckoutSession, // <- Add this line
    getUserEmailPreferences,
    updateUserEmailPreferences,
    toggleAutopilot,
    getReciprocalBalance,
    getReciprocalOpportunities,
    getReciprocalMatches,
    triggerAutoReciprocalShare,
    getReciprocalActivity,
    getQueueAutomationStatus,
    getAIEfficiencyMetrics,
    toggleReciprocalAutopilot,
    updateReciprocalAutopilotSettings,
    getReciprocalDashboardStats,
    getReciprocalAIHealthCheck,
    analyzeContentShareability,
    upgradeToAITier, // Keep this one
    downgradeFromAITier, // Keep this one
    upgradeToAITier,
    downgradeFromAITier,
    predictContentSharing,
    getSavedMLPrediction,
    getContentAIInsights,
    getMLInsights,
    retrainMLModels,
    getReciprocalAutopilotSettings, // Add this line
    // ADD THESE THREE NEW LINES:
    getAIContactRecommendations,
    getAIContactInsights,
    updateAllAIContactScores,
    getABTestResults, // ✅ NEW
    acknowledgeQueueAlert, // ✅ NEW
    loginWithGoogle, // ✅ ADD THIS LINE
    uploadMedia,
    deleteMedia,
    getMediaHealthCheck,
    getUserProgress,
    // Pool API Functions
    getPoolCredits,
    getPoolQueue,
    submitToPool,
    submitPoolReview,
    getMyPoolSubmissions,
    getPoolStats,
    getCollaborationMatches, // ✅ ADD THIS LINE
    getGenesisMetrics, // ✅ ADD THIS LINE
    sendMessageToCreator,
    followCreator,
    getQuickConnectBoard,
    createQuickConnectRequest,
    offerQuickConnectHelp,
    getMyQuickConnectRequests,
    getMyHelpGiven,
    getQuickConnectTokens,
    getQuickConnectLeaderboard,
    // ✅ NEW: Messaging API Functions
    sendMessage,
    getAllConversations,
    getConversation,
    markMessageAsRead,

    // ✅ NEW: Following API Functions
    followUser,
    unfollowUser,
    getFollowStatus,
    getFollowingList,
    getFollowersList,
    getFollowStats,
    suggestQuickConnectHelpers, // ✅ ADD
    acceptQuickConnectHelp, // ✅ ADD
    rateQuickConnectHelp, // ✅ ADD
    getCurrentUser, // ✅ ADD
  };
};
