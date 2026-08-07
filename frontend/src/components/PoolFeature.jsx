import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Users,
  Heart,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  Star,
  ExternalLink,
  MessageSquare,
  UserPlus,
  Award,
  ChevronRight,
  X,
  ArrowRight,
  Eye,
  Clock,
  Link2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  PlayCircle,
  Mail,
  Send,
  Home,
  Menu,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AIInsightsTab from "./AIInsightsTab.jsx";
import { useApi } from "../lib/api";

const scrollbarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }

  .pool-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .pool-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .pool-scroll::-webkit-scrollbar-thumb:hover {
    background: #333;
  }
  .pool-scroll::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 6px;
  }
  .pool-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #f3f4f6;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    50% { box-shadow: 0 0 40px rgba(0,0,0,0.2); }
  }

  @keyframes pulse-scale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .emoji-3d {
    font-size: 3rem;
    filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.3));
    animation: float 3s ease-in-out infinite;
  }

  .step-indicator {
    transition: all 0.3s ease;
  }

  .step-indicator.active {
    transform: scale(1.1);
  }

  .message-badge-pulse {
    animation: pulse-scale 2s ease-in-out infinite;
  }
`;

// ✅ ERROR BOUNDARY COMPONENT
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PoolFeature Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-2xl border-2 border-red-300 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PoolFeature = ({ user, onNavigateHome, onNavigateToRoutes }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showMessagesWidget, setShowMessagesWidget] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [hasVisited, setHasVisited] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedCollabCreator, setSelectedCollabCreator] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [visitTime, setVisitTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [genesisMetrics, setGenesisMetrics] = useState(null);
  const [showMessageThread, setShowMessageThread] = useState(false);
  const [currentThread, setCurrentThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [allConversations, setAllConversations] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const [feedback, setFeedback] = useState({
    wouldFollow: null,
    resonates: null,
    notes: "",
  });

  const [newSubmission, setNewSubmission] = useState({
    title: "",
    url: "",
    category: "",
    pitch: "",
  });

  const [userStats, setUserStats] = useState({
    followers: 0,
    genuineConnections: 0,
    collaborations: 0,
    streak: 0,
  });

  const [discoveryQueue, setDiscoveryQueue] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [potentialCollabs, setPotentialCollabs] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  const {
    getPoolQueue,
    submitPoolReview,
    getMyPoolSubmissions,
    submitToPool,
    getContentDetails,
    getCollaborationMatches,
    getGenesisMetrics,
    sendMessageToCreator,
    followCreator,
    sendMessage,
    getAllConversations,
    getConversation,
    markMessageAsRead,
    followUser,
    unfollowUser,
    getFollowStatus,
    getFollowingList,
  } = useApi();

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ✅ FIXED: Single initialization effect with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (isMounted) {
        await fetchAllConversations();
        await fetchFollowingList();
      }
    };

    initializeData();

    // Polling for new messages every 30 seconds
    const messageInterval = setInterval(() => {
      if (isMounted) {
        fetchAllConversations();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(messageInterval);
    };
  }, []); // Run once on mount

  // Separate effect for tab changes
  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  // Timer effect for content visit
  useEffect(() => {
    let interval;
    if (visitTime && !hasVisited) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - visitTime) / 1000;
        const remaining = Math.max(0, 10 - Math.floor(elapsed));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setHasVisited(true);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visitTime, hasVisited]);

  // 🔍 TEMPORARY DEBUG - Add this right here
  useEffect(() => {
    console.log("🔍 DEBUG: Fetching my submissions...");
    fetch("http://localhost:8000/pool/my-submissions", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        console.log("🔍 DEBUG: My submissions response:", data);
        console.log("🔍 DEBUG: Array length:", data.length);

        // ✅ FIXED: data is the array directly
        if (data && data.length > 0) {
          console.log("🔍 DEBUG: First submission status:", data[0]?.status);
        } else {
          console.log("🔍 DEBUG: No submissions found");
        }
      })
      .catch((err) => console.error("🔍 DEBUG ERROR:", err));
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "discover") {
        await fetchDiscoveryQueue();
      } else if (activeTab === "collaborate") {
        await fetchCollaborationMatches();
      } else if (activeTab === "my-content") {
        await fetchMySubmissions();
      }
      await fetchUserStats();
    } catch (error) {
      console.error("Error fetching pool data:", error);
      setError(error.message || "Failed to load data");
      toast.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const data = await getGenesisMetrics();
      if (!data.success || !data.metrics) {
        throw new Error("Invalid metrics data received");
      }

      setGenesisMetrics(data.metrics);

      setUserStats({
        followers: data.metrics.total_reviews_given || 0,
        genuineConnections: data.metrics.connections || 0,
        collaborations: data.metrics.active_collabs || 0,
        streak: data.metrics.day_streak || 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setGenesisMetrics(null);
      setUserStats({
        followers: 0,
        genuineConnections: 0,
        collaborations: 0,
        streak: 0,
      });
    }
  };

  const fetchDiscoveryQueue = async () => {
    try {
      const response = await fetch("http://localhost:8000/pool/queue", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let queueItems = [];

      if (Array.isArray(data)) {
        queueItems = data;
      } else if (data.results && Array.isArray(data.results)) {
        queueItems = data.results;
      } else if (data.queue && Array.isArray(data.queue)) {
        queueItems = data.queue;
      } else if (data.items && Array.isArray(data.items)) {
        queueItems = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        queueItems = data.data;
      } else {
        console.error("Unrecognized data format:", data);
        throw new Error("Invalid queue data received");
      }

      const enrichedQueue = await enrichPoolContent(
        queueItems.map((item) => ({
          ...item,
          id: item.id,
          content_id: item.content_id,
          title: item.title,
          original_url: item.original_url,
          category: item.category,
          pitch: item.pitch || "",
          review_count: item.review_count || 0,
          average_rating: item.average_rating || 0,
          alignment_score: item.alignment_score || 0,
          match_reason: item.match_reason || "",
          user_id: item.user_id || item.content_id,
        })),
      );

      setDiscoveryQueue(enrichedQueue);

      if (enrichedQueue.length > 0) {
        setCurrentVideo(enrichedQueue[0]);
      }
    } catch (error) {
      console.error("Error in fetchDiscoveryQueue:", error);
      throw error;
    }
  };

  // ✅ FIXED: Enhanced collaboration matches with proper user_id handling
  const fetchCollaborationMatches = async () => {
    try {
      const collabData = await getCollaborationMatches(10);
      if (!Array.isArray(collabData)) {
        throw new Error("Invalid collaboration data received");
      }

      setPotentialCollabs(
        collabData
          .map((item) => {
            // ✅ Multiple fallback strategies for user_id
            const userId =
              item.user_id ||
              item.creator_user_id ||
              item.content?.user_id ||
              item.id;

            if (!userId) {
              console.warn("Missing user_id for collab item:", item);
            }

            return {
              id: item.id,
              user_id: userId,
              creator: item.title || item.creator_name || `Creator ${item.id}`,
              niche: item.category || "General",
              followers: item.followers || Math.floor(Math.random() * 100),
              matchScore: item.collab_score || item.alignment_score || 50,
              reason:
                item.match_reason ||
                "Both at similar growth stages with overlapping audiences",
              collabIdea: item.collab_idea || "Cross-promotion opportunity",
              avatarColor: getRandomColor(),
              content_id: item.content_id,
            };
          })
          .filter((item) => item.user_id), // ✅ Filter out items without user_id
      );
    } catch (error) {
      console.error("Error fetching collaboration matches:", error);
      throw error;
    }
  };

  // ✅ FIXED: Added loading states and error handling
  const fetchAllConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const conversations = await getAllConversations();
      setAllConversations(conversations || []);

      const unreadCount = conversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0,
      );

      console.log(
        `📬 Loaded ${conversations.length} conversations (${unreadCount} unread)`,
      );
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load messages");
      setAllConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [getAllConversations]);

  // ✅ FIXED: Added loading states and error handling
  const fetchThreadMessages = useCallback(
    async (userId) => {
      setIsLoadingThread(true);
      try {
        const response = await getConversation(userId);
        setThreadMessages(response.messages || []);

        const conversation = allConversations.find(
          (c) => c.other_user_id === userId,
        );
        const username =
          conversation?.other_user_username ||
          response.messages[0]?.other_user_username ||
          response.other_user_username ||
          "User";

        setCurrentThread({
          userId,
          threadId: response.thread_id,
          username: username,
        });

        console.log(
          `💬 Loaded ${response.messages.length} messages in thread for ${username}`,
        );
      } catch (error) {
        console.error("Error fetching thread:", error);
        toast.error("Failed to load conversation");
        setThreadMessages([]);
      } finally {
        setIsLoadingThread(false);
      }
    },
    [getConversation, allConversations],
  );

  const fetchFollowingList = useCallback(async () => {
    try {
      const response = await getFollowingList();
      const following = new Set(response.follows.map((f) => f.following_id));
      setFollowedUsers(following);
      console.log(`👥 Following ${following.size} users`);
    } catch (error) {
      console.error("Error fetching following list:", error);
      setFollowedUsers(new Set());
    }
  }, [getFollowingList]);

  const fetchMySubmissions = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/pool/my-submissions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // 🔍 DEBUG: Log the actual data structure
        console.log("=== MY SUBMISSIONS DEBUG ===");
        console.log("Full API Response:", data);
        console.log("Number of submissions:", data?.length || 0);
        if (data && data.length > 0) {
          console.log("First submission structure:", data[0]);
          console.log("First submission keys:", Object.keys(data[0]));
          console.log("First submission status:", data[0].status);
        }
        console.log("User credits (share_count):", user?.share_count);
        console.log("=========================");

        setMySubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching my submissions:", error);
    }
  };

  const enrichPoolContent = async (poolItems) => {
    if (!poolItems || poolItems.length === 0) return [];

    try {
      const enrichedItems = await Promise.all(
        poolItems.map(async (poolItem) => {
          const fallbackData = {
            ...poolItem,
            id: poolItem.id,
            content_id: poolItem.content_id,
            user_id: poolItem.user_id || poolItem.id,
            creator: `Creator ${poolItem.content_id || poolItem.id}`,
            niche: poolItem.category || "General",
            followers: Math.floor(Math.random() * 50) + 10,
            description: poolItem.pitch || "Check out this content",
            tags: poolItem.category
              ? [poolItem.category.toLowerCase()]
              : ["general"],
            mutualInterest: poolItem.alignment_score || 50,
            why:
              poolItem.match_reason ||
              "Algorithmically matched based on your interests",
            creatorBio: poolItem.pitch || "Building great content",
            avatarColor: getRandomColor(),
            url: poolItem.original_url,
            original_url: poolItem.original_url,
            title: poolItem.title || "Untitled Content",
          };

          if (!poolItem.content_id) {
            return fallbackData;
          }

          try {
            const contentDetails = await getContentDetails(poolItem.content_id);

            return {
              ...poolItem,
              ...fallbackData,
              ...contentDetails,
              user_id:
                contentDetails.user_id || poolItem.user_id || poolItem.id,
              creator:
                contentDetails.user?.username ||
                contentDetails.username ||
                fallbackData.creator,
              url: poolItem.original_url || contentDetails.url,
              original_url: poolItem.original_url || contentDetails.url,
              description:
                poolItem.pitch ||
                contentDetails.description ||
                fallbackData.description,
              creatorBio:
                poolItem.pitch || contentDetails.bio || fallbackData.creatorBio,
            };
          } catch (error) {
            console.warn(
              `Failed to enrich content ${poolItem.content_id}:`,
              error,
            );
            return fallbackData;
          }
        }),
      );
      return enrichedItems;
    } catch (error) {
      console.error("Failed to enrich pool content:", error);
      return poolItems.map((item) => ({
        ...item,
        id: item.id,
        user_id: item.user_id || item.id,
        creator: `Creator ${item.content_id || item.id}`,
        niche: item.category || "General",
        avatarColor: getRandomColor(),
        url: item.original_url,
        original_url: item.original_url,
        tags: item.category ? [item.category.toLowerCase()] : ["general"],
        followers: Math.floor(Math.random() * 50) + 10,
        creatorBio: item.pitch || "Building great content",
        mutualInterest: item.alignment_score || 50,
        why: item.match_reason || "Algorithmically matched",
        title: item.title || "Untitled Content",
      }));
    }
  };

  const getRandomColor = () => {
    const colors = ["bg-gray-700", "bg-gray-800", "bg-gray-900", "bg-black"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleVisitLink = () => {
    const urlToOpen = selectedContent?.original_url || selectedContent?.url;

    if (!urlToOpen) {
      toast.error("No URL available for this content");
      console.error("Missing URL in selectedContent:", selectedContent);
      return;
    }

    console.log("Opening URL:", urlToOpen);

    try {
      window.open(urlToOpen, "_blank", "noopener,noreferrer");
      setVisitTime(Date.now());
      setCurrentStep(2);
      toast.success("Link opened! Take your time reading.");
    } catch (error) {
      console.error("Error opening link:", error);
      toast.error("Failed to open link. Please try again.");
    }
  };

  // ✅ FIXED: Added optimistic updates with rollback
  const handleSubmitFeedback = async () => {
    if (feedback.wouldFollow === null || !feedback.resonates) {
      toast.error("Please answer both questions");
      return;
    }

    // Optimistic update - remove from queue immediately
    const contentId = selectedContent.id;
    const contentSnapshot = selectedContent;
    setDiscoveryQueue((prev) => prev.filter((item) => item.id !== contentId));
    setShowDetailsModal(false);

    try {
      const response = await submitPoolReview({
        content_id: selectedContent.content_id,
        rating: feedback.wouldFollow ? 5 : 3,
        feedback: feedback.notes || undefined,
        categories_match: true,
        is_spam: false,
        is_quality: feedback.wouldFollow,
      });

      // ✅ ENHANCED: Better unlock notifications
      if (response.unlocked_content) {
        toast.success(
          `🚀 YOUR CONTENT IS NOW LIVE!\n"${response.unlocked_content.title}" is in the discovery queue!`,
          {
            duration: 8000,
            icon: "🎉",
            style: {
              background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "15px",
              padding: "16px",
              borderRadius: "12px",
              border: "2px solid #4ade80",
            },
          },
        );

        // Update user's share_count immediately
        if (user) {
          user.share_count = response.remaining_credits;
        }
      } else if (response.remaining_credits > 0) {
        toast.success(
          `✨ Credit Earned!\nYou now have ${response.remaining_credits} review credit${response.remaining_credits !== 1 ? "s" : ""}. Keep reviewing to unlock your content!`,
          {
            duration: 5000,
            icon: "💳",
            style: {
              background: "#000",
              color: "#fff",
              fontWeight: "bold",
            },
          },
        );
      } else {
        toast.success(
          "✅ Review submitted! Thank you for helping creators grow.",
          {
            duration: 3000,
          },
        );
      }

      // Refresh data
      await fetchUserStats();
      await fetchMySubmissions();
      await fetchDiscoveryQueue(); // ✅ Refresh queue to remove reviewed content
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(
        error.message || "Failed to submit feedback. Please try again.",
      );

      // Rollback optimistic update
      setDiscoveryQueue((prev) => [contentSnapshot, ...prev]);
      setShowDetailsModal(true);
    } finally {
      setFeedback({ wouldFollow: null, resonates: null, notes: "" });
      setHasVisited(false);
      setVisitTime(null);
      setCurrentStep(1);
    }
  };

  const handleSubmitContent = async (e) => {
    e.preventDefault();

    try {
      new URL(newSubmission.url);
    } catch (error) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (!newSubmission.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!newSubmission.category) {
      toast.error("Please select a category");
      return;
    }

    try {
      const response = await submitToPool({
        title: newSubmission.title.trim(),
        original_url: newSubmission.url.trim(),
        category: newSubmission.category,
        pitch: newSubmission.pitch.trim() || undefined,
      });

      setShowSubmitModal(false);
      setNewSubmission({ title: "", url: "", category: "", pitch: "" });
      await fetchAllData();

      // ✅ Show appropriate message based on credits
      if (user?.share_count > 0) {
        toast.success(
          `✅ Content submitted and UNLOCKED!\nYou had ${user.share_count} credit${user.share_count !== 1 ? "s" : ""}, so it's live in the queue now!`,
          {
            duration: 6000,
            icon: "🚀",
            style: {
              background: "#000",
              color: "#fff",
              fontWeight: "bold",
            },
          },
        );
      } else {
        toast.success(
          "📝 Content submitted!\nReview other creators' work to unlock it in the discovery queue.",
          {
            duration: 5000,
            icon: "⏳",
          },
        );
      }
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error(
        error.message || "Failed to submit content. Please try again.",
      );
    }
  };

  const handleSendMessageInThread = async () => {
    if (!newMessage.trim() || !currentThread) {
      return;
    }

    try {
      await sendMessage(currentThread.userId, newMessage.trim());

      await fetchThreadMessages(currentThread.userId);
      await fetchAllConversations();

      setNewMessage("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    }
  };

  // ✅ FIXED: Enhanced Follow Button with proper state management
  const FollowButton = ({ userId, username, initialFollowing = false }) => {
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    // ✅ FIX: Derive state directly from global state instead of local state
    const isFollowing = followedUsers.has(userId);

    const handleToggleFollow = async (e) => {
      e.stopPropagation();

      if (!userId) {
        toast.error("Invalid user");
        return;
      }

      setIsFollowLoading(true);

      // ✅ FIX: Capture current state before update
      const wasFollowing = isFollowing;

      try {
        // ✅ FIX: Update global state immediately (optimistic update)
        setFollowedUsers((prev) => {
          const next = new Set(prev);
          if (wasFollowing) {
            next.delete(userId);
          } else {
            next.add(userId);
          }
          return next;
        });

        // ✅ FIX: Make API call based on captured state
        if (wasFollowing) {
          await unfollowUser(userId);
          toast.success(`Unfollowed ${username}`);
        } else {
          await followUser(userId);
          toast.success(`✅ Following ${username}!`);
        }

        // Refresh from backend to ensure consistency
        await fetchFollowingList();
      } catch (error) {
        console.error("Error toggling follow:", error);
        toast.error(error.message || "Failed to update follow status");

        // ✅ FIX: Rollback using captured state
        setFollowedUsers((prev) => {
          const next = new Set(prev);
          if (wasFollowing) {
            next.add(userId); // Restore the follow
          } else {
            next.delete(userId); // Remove the follow
          }
          return next;
        });
      } finally {
        setIsFollowLoading(false);
      }
    };

    return (
      <button
        onClick={handleToggleFollow}
        disabled={isFollowLoading}
        className={`
        px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300
        flex items-center justify-center gap-2 min-w-[120px]
        ${
          isFollowing
            ? "bg-gray-100 border-2 border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-600"
            : "bg-black text-white hover:bg-gray-800 shadow-lg"
        }
        ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}
      `}
      >
        {isFollowLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{isFollowing ? "Unfollowing..." : "Following..."}</span>
          </>
        ) : isFollowing ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Follow</span>
          </>
        )}
      </button>
    );
  };

  // Sidebar Component
  const Sidebar = () => {
    const unreadCount = allConversations.reduce(
      (sum, c) => sum + (c.unread_count || 0),
      0,
    );
    const sidebarItems = [
      {
        id: "discover",
        label: "Discover",
        icon: Sparkles,
        badge: discoveryQueue.length,
        emoji: "🔍",
      },
      {
        id: "collaborate",
        label: "Collaborate",
        icon: Users,
        badge: potentialCollabs.length,
        emoji: "🤝",
      },
      {
        id: "ai-insights",
        label: "AI Insights",
        icon: Sparkles,
        emoji: "🤖",
      },
      {
        id: "my-content",
        label: "My Content",
        icon: TrendingUp,
        emoji: "📊",
      },
    ];

    return (
      <>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-black text-white p-3 rounded-xl shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed lg:relative top-0 left-0 h-screen
            w-64 bg-white border-r-4 border-gray-900
            flex flex-col z-40
            transform transition-transform duration-300 ease-in-out
            lg:transform-none
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="p-6 border-b-4 border-gray-900 bg-black text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <h2 className="text-xl font-bold">Audience Pool</h2>
                  <p className="text-xs text-gray-300">Find your fans</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Credits Card - Now clickable in all states */}
              <div
                className={`rounded-lg p-3 text-center shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                  user?.share_count > 0 &&
                  mySubmissions.filter((s) => s.status === "pending").length > 0
                    ? "bg-gradient-to-br from-green-600 to-green-700 text-white"
                    : user?.share_count > 0
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                      : "bg-white/10 backdrop-blur text-white hover:bg-white/20"
                }`}
                onClick={() => {
                  if (
                    user?.share_count > 0 &&
                    mySubmissions.filter((s) => s.status === "pending").length >
                      0
                  ) {
                    // Go to unlock page
                    setActiveTab("my-content");
                    setIsSidebarOpen(false);
                  } else {
                    // Go to review queue to earn credits
                    setActiveTab("discover");
                    setIsSidebarOpen(false);
                  }
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">💳</span>
                  <span className="text-xs font-bold">Credits</span>
                </div>
                <div className="text-2xl font-bold">
                  {user?.share_count || 0}
                </div>
                <p className="text-xs mt-1 opacity-90">
                  {user?.share_count > 0 &&
                  mySubmissions.filter((s) => s.status === "pending").length > 0
                    ? "🚀 Tap to unlock"
                    : user?.share_count > 0
                      ? "Ready to use"
                      : "👆 Review to earn"}
                </p>
              </div>

              {/* Pending Card */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl"></span>
                  <span className="text-xs font-bold">Pending</span>
                </div>
                <div className="text-2xl font-bold">
                  {mySubmissions.filter((s) => s.status === "pending").length}
                </div>
                <p className="text-xs text-gray-300 mt-1 opacity-90">
                  Awaiting unlock
                </p>
              </div>

              {/* Connects Card */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl"></span>
                  <span className="text-xs font-bold">Connects</span>
                </div>
                <div className="text-2xl font-bold">
                  {userStats.genuineConnections || 0}
                </div>
                <p className="text-xs text-gray-300 mt-1 opacity-90">
                  Real connections
                </p>
              </div>

              {/* Streak Card */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl"></span>
                  <span className="text-xs font-bold">Streak</span>
                </div>
                <div className="text-2xl font-bold">
                  {userStats.streak || 0}
                </div>
                <p className="text-xs text-gray-300 mt-1 opacity-90">
                  Days active
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto pool-scroll p-4">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      font-bold text-sm transition-all duration-200
                      ${
                        isActive
                          ? "bg-black text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => setShowGuideModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm transition"
              >
                <HelpCircle className="w-5 h-5" />
                <span>How It Works</span>
              </button>

              <button
                onClick={() => setShowMessagesWidget(!showMessagesWidget)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm transition relative"
              >
                <Mail className="w-5 h-5" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full message-badge-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (onNavigateToRoutes) {
                    onNavigateToRoutes();
                  } else {
                    navigate("/app/home");
                  }
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 hover:from-purple-200 hover:to-purple-100 border-2 border-purple-200 hover:border-purple-400 font-bold text-sm transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>
                  {onNavigateToRoutes ? "Change Growth Path" : "Back to Home"}
                </span>
              </button>
            </div>
          </nav>
        </aside>
      </>
    );
  };

  const WelcomeScreen = () => (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pool-scroll">
        <div className="px-6 py-12 text-center sm:px-8 lg:px-10">
          <div className="emoji-3d mx-auto mb-6 text-6xl">🎯</div>
          <div className="mb-10">
            <h2 className="mb-3 text-4xl font-bold sm:text-5xl">
              Welcome to Audience Pool!
            </h2>
            <p className="text-lg text-gray-600">
              Find your first 100 true fans through genuine connections
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
              <div className="mb-4 text-5xl">🔍</div>
              <h3 className="mb-2 text-xl font-bold">
                Discover Aligned Creators
              </h3>
              <p className="text-gray-600">
                See content matched to your interests. Only engage with what
                resonates.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
              <div className="mb-4 text-5xl">💬</div>
              <h3 className="mb-2 text-xl font-bold">Give Honest Feedback</h3>
              <p className="text-gray-600">
                Help creators improve while finding your future collaborators.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
              <div className="mb-4 text-5xl">🤝</div>
              <h3 className="mb-2 text-xl font-bold">Build Real Connections</h3>
              <p className="text-gray-600">
                Quality over quantity. Find people who genuinely care about your
                work.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="mx-auto mt-12 flex items-center justify-center gap-3 rounded-2xl bg-black px-10 py-5 text-xl font-bold text-white shadow-xl transition hover:bg-gray-800"
          >
            <PlayCircle className="h-7 w-7" />
            Start Discovering
          </button>
        </div>
      </div>
    </div>
  );

  const DiscoverTab = () => (
    <div className="space-y-4">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="emoji-3d inline-block mb-3">✨</div>
        <h3 className="font-bold text-xl mb-2">Your Discovery Queue</h3>
        <p className="text-sm text-gray-600 max-w-md">
          We've matched you with {discoveryQueue.length} creators building
          similar audiences. Only read what genuinely interests you!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mx-6 sm:mx-8 lg:mx-10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                Error loading content
              </p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchAllData()}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-gray-700">
            Finding perfect matches...
          </p>
        </div>
      ) : discoveryQueue.length === 0 ? (
        <div className="text-center py-12">
          <div className="emoji-3d inline-block mb-4">🎉</div>
          <p className="font-semibold text-gray-700 mb-2">
            You've discovered everything!
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Check back soon for new creators, or submit your own content!
          </p>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 px-6 pb-6 sm:px-8 lg:grid-cols-2 lg:px-10">
          {discoveryQueue.map((content, index) => (
            <div
              key={content.id}
              className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-black hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                  #{index + 1} in queue
                </span>
                <span className="text-2xl">
                  {content.mutualInterest >= 80
                    ? "🔥"
                    : content.mutualInterest >= 60
                      ? "✨"
                      : "👀"}
                </span>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-14 h-14 ${content.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}
                >
                  {(() => {
                    const name = content.creator || "User";
                    const initials = name
                      .split(" ")
                      .filter((n) => n.length > 0)
                      .map((n) => n[0]?.toUpperCase() || "")
                      .join("")
                      .substring(0, 2);
                    return initials || "U";
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base">{content.creator}</h4>
                    <span className="text-xs text-gray-500">
                      • {content.followers} followers
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {content.creatorBio}
                  </p>
                  <span className="inline-block bg-gray-100 text-black text-xs font-semibold px-3 py-1 rounded-full border border-gray-300">
                    {content.niche}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 mb-4 border-2 border-gray-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700">
                    Alignment Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-black">
                      {content.mutualInterest}%
                    </span>
                    <span className="text-xl">
                      {content.mutualInterest >= 80
                        ? "🎯"
                        : content.mutualInterest >= 60
                          ? "💪"
                          : "👍"}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-full h-3 overflow-hidden mb-3 border-2 border-gray-300 shadow-inner">
                  <div
                    className="bg-black h-full transition-all duration-500 rounded-full"
                    style={{ width: `${content.mutualInterest}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-black" />
                  {content.why}
                </p>
              </div>

              <div className="mb-4">
                <h5 className="font-bold text-base mb-2">{content.title}</h5>
                <p className="text-sm text-gray-600 mb-3">
                  {content.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(content.tags || ["general"]).map((tag, tagIndex) => (
                    <span
                      key={`${content.id}-tag-${tagIndex}`}
                      className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-300 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedContent(content);
                  setShowDetailsModal(true);
                  setHasVisited(false);
                  setVisitTime(null);
                  setCurrentStep(1);
                  setFeedback({
                    wouldFollow: null,
                    resonates: null,
                    notes: "",
                  });
                }}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-base hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <Eye className="w-5 h-5" />
                Read & Give Feedback
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const CollaborateTab = () => {
    const handleSendMessage = async (collab) => {
      const userId = collab.user_id || collab.id;

      if (!userId) {
        toast.error("Unable to identify user. Please try again.");
        console.error("Missing user_id in collab object:", collab);
        return;
      }

      setSelectedCollabCreator({
        ...collab,
        user_id: userId,
        id: userId,
      });
      setShowMessageModal(true);
    };

    const submitMessage = async () => {
      if (!messageText.trim()) {
        toast.error("Please enter a message");
        return;
      }

      try {
        const userId =
          selectedCollabCreator.user_id || selectedCollabCreator.id;

        if (!userId) {
          throw new Error("Invalid user ID");
        }

        await sendMessageToCreator(userId, messageText);
        toast.success("Message sent!");
        setShowMessageModal(false);
        setMessageText("");
        setSelectedCollabCreator(null);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(error.message || "Failed to send message");
      }
    };

    return (
      <div className="space-y-4">
        <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
          <div className="emoji-3d inline-block mb-3">🤝</div>
          <h3 className="font-bold text-xl mb-2">Your Collaboration Matches</h3>
          <p className="text-sm text-gray-600 max-w-md">
            Found {potentialCollabs.length} creators at similar stages ready to
            grow together!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-gray-700">
              Finding your perfect partners...
            </p>
          </div>
        ) : potentialCollabs.length === 0 ? (
          <div className="text-center py-12">
            <div className="emoji-3d inline-block mb-4">🌱</div>
            <p className="text-sm text-gray-600 mb-2">
              No collaboration matches yet
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Review more content to find potential partners!
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-6 px-6 pb-6 sm:px-8 lg:grid-cols-2 lg:px-10">
            {potentialCollabs.map((collab, index) => {
              const userId = collab.user_id || collab.id;

              if (!userId) {
                console.error("Invalid collab data:", collab);
                return null;
              }

              return (
                <div
                  key={collab.id}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-black hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                      Match #{index + 1}
                    </span>
                    <span className="text-2xl">
                      {collab.matchScore >= 80
                        ? "⭐"
                        : collab.matchScore >= 60
                          ? "✨"
                          : "💫"}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-14 h-14 ${collab.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}
                    >
                      {(() => {
                        const name = collab.creator || "User";
                        const initials = name
                          .split(" ")
                          .filter((n) => n.length > 0)
                          .map((n) => n[0]?.toUpperCase() || "")
                          .join("")
                          .substring(0, 2);
                        return initials || "U";
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-base">
                          {collab.creator}
                        </h4>
                        <span className="text-xs text-gray-500">
                          • {collab.followers} followers
                        </span>
                      </div>
                      <span className="inline-block bg-gray-100 text-black text-xs font-semibold px-3 py-1 rounded-full border border-gray-300">
                        {collab.niche}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-black">
                        {collab.matchScore}%
                      </div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 mb-4 border-2 border-gray-300">
                    <p className="text-sm text-gray-600 mb-3">
                      <strong className="text-black">Why you match:</strong>{" "}
                      {collab.reason}
                    </p>
                    <p className="text-sm font-semibold text-black flex items-start gap-2">
                      <span className="text-xl">💡</span>
                      <span>Suggested collab: {collab.collabIdea}</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSendMessage(collab)}
                      className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </button>
                    <FollowButton
                      userId={userId}
                      username={collab.creator}
                      initialFollowing={followedUsers.has(userId)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const MyContentTab = () => (
    <div className="space-y-4">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="emoji-3d inline-block mb-3">📊</div>
        <h3 className="font-bold text-xl mb-2">Your Performance</h3>
        <p className="text-sm text-gray-600">
          Track how your content resonates
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 sm:px-8 lg:px-10">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-300 hover:border-black transition">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💖</span>
            <span className="text-xs font-semibold text-gray-700">
              Genuine Interest
            </span>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {mySubmissions.reduce(
              (sum, s) => sum + (s.would_follow_count || 0),
              0,
            )}
          </div>
          <p className="text-xs text-gray-600">would follow you</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-300 hover:border-black transition">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👀</span>
            <span className="text-xs font-semibold text-gray-700">
              Real Reads
            </span>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {mySubmissions.reduce((sum, s) => sum + (s.review_count || 0), 0)}
          </div>
          <p className="text-xs text-gray-600">genuine readers</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-gray-700">Loading your content...</p>
        </div>
      ) : mySubmissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="emoji-3d inline-block mb-4">🚀</div>
          <p className="text-sm text-gray-600 mb-2">No submissions yet</p>
          <p className="text-xs text-gray-500 mb-4">
            Share your content to start building genuine connections!
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-6 pb-6 sm:px-8 lg:px-10">
          {/* ✅ BLACK & WHITE BULK UNLOCK BANNER */}
          {mySubmissions.filter((s) => s.status === "pending").length > 0 &&
            user?.share_count > 0 && (
              <div className="bg-black text-white border-4 border-black rounded-2xl p-6 shadow-2xl mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">🚀</span>
                      <h4 className="font-bold text-2xl">Ready to Go Live!</h4>
                    </div>
                    <p className="text-base text-white/90 mb-1">
                      You have{" "}
                      <strong className="text-white underline decoration-2">
                        {user.share_count} review credit
                        {user.share_count !== 1 ? "s" : ""}
                      </strong>{" "}
                      available.
                    </p>
                    <p className="text-sm text-white/70">
                      Unlock{" "}
                      {Math.min(
                        user.share_count,
                        mySubmissions.filter((s) => s.status === "pending")
                          .length,
                      )}{" "}
                      pending item
                      {Math.min(
                        user.share_count,
                        mySubmissions.filter((s) => s.status === "pending")
                          .length,
                      ) !== 1
                        ? "s"
                        : ""}{" "}
                      to add them to the discovery queue!
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      const pendingItems = mySubmissions.filter(
                        (s) => s.status === "pending",
                      );
                      const toUnlock = Math.min(
                        user.share_count,
                        pendingItems.length,
                      );

                      if (toUnlock === 0) {
                        toast.error("No items to unlock");
                        return;
                      }

                      try {
                        let successCount = 0;
                        let failCount = 0;

                        for (let i = 0; i < toUnlock; i++) {
                          const item = pendingItems[i];

                          // ✅ LOG SUBMISSION DATA
                          console.log(`🔓 Unlocking submission ${item.id}...`);
                          console.log(`📦 Submission data:`, item);

                          // ✅ Use the actual submission record to find real submission_id
                          const submissionId = item.submission_id || item.id;

                          console.log(`🔍 Item data:`, item);
                          console.log(
                            `🎯 Using submission_id: ${submissionId}`,
                          );

                          const response = await fetch(
                            `${API_BASE_URL}/pool/submissions/${submissionId}/unlock`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                                "Content-Type": "application/json",
                              },
                            },
                          );

                          if (response.ok) {
                            successCount++;
                            const data = await response.json();
                            console.log("✅ Unlocked:", data);
                          } else {
                            // ✅ LOG ERROR DETAILS
                            failCount++;
                            const error = await response.json();
                            console.error(
                              `❌ Failed to unlock submission ${item.id}:`,
                              error,
                            );
                            console.error(`❌ Error detail:`, error.detail);
                          }
                        }

                        if (successCount > 0) {
                          toast.success(
                            `🎉 ${successCount} item${successCount !== 1 ? "s" : ""} now LIVE in discovery queue!`,
                            {
                              duration: 6000,
                              icon: "🚀",
                              style: {
                                background:
                                  "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
                                color: "#fff",
                                fontWeight: "bold",
                                fontSize: "15px",
                                padding: "16px",
                                borderRadius: "12px",
                                border: "2px solid #4ade80",
                              },
                            },
                          );
                        }

                        // ✅ SHOW FAILURE TOAST IF ANY FAILED
                        if (failCount > 0) {
                          toast.error(
                            `Failed to unlock ${failCount} item${failCount !== 1 ? "s" : ""}`,
                          );
                        }

                        // Update user credits locally
                        if (user) {
                          user.share_count = Math.max(
                            0,
                            user.share_count - successCount,
                          );
                        }

                        await fetchMySubmissions();
                        await fetchUserStats();
                      } catch (error) {
                        console.error("Error bulk unlocking:", error);
                        toast.error(
                          error.message || "Failed to unlock content",
                        );
                      }
                    }}
                    className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap border-2 border-white"
                  >
                    <span className="text-xl">⚡</span>
                    <span className="text-base">
                      Unlock All (
                      {Math.min(
                        user.share_count,
                        mySubmissions.filter((s) => s.status === "pending")
                          .length,
                      )}
                      )
                    </span>
                  </button>
                </div>
              </div>
            )}
          {mySubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-black transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-base mb-2">
                    {submission.title}
                  </h4>
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                      submission.status === "approved"
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {submission.status === "approved"
                      ? "✅ ACTIVE - In Discovery Queue"
                      : `⏳ PENDING - Waiting to unlock`}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                {submission.description || submission.pitch}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {new Date(submission.created_at).toLocaleDateString()}
                </span>
                <a
                  href={submission.url || submission.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:underline font-medium"
                >
                  View →
                </a>
              </div>

              {/* ✅ UNLOCK BUTTON - Shows when: pending status + has credits */}
              {submission.status === "pending" && user?.share_count > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        // ✅ Use the correct ID property
                        const submissionId = submission.id;

                        console.log(
                          `🔓 Attempting to unlock submission ID: ${submissionId}`,
                        );

                        const response = await fetch(
                          `${API_BASE_URL}/pool/submissions/${submissionId}/unlock`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                              "Content-Type": "application/json",
                            },
                          },
                        );

                        if (!response.ok) {
                          const error = await response.json();
                          console.error("❌ Unlock failed:", error);
                          throw new Error(error.detail || "Failed to unlock");
                        }

                        const data = await response.json();
                        console.log("✅ Unlock successful:", data);

                        toast.success(
                          `🚀 "${submission.title}" is now LIVE in the discovery queue!`,
                          {
                            duration: 6000,
                            icon: "🎉",
                            style: {
                              background: "#000",
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: "15px",
                              padding: "16px",
                              borderRadius: "12px",
                            },
                          },
                        );

                        // Update user credits locally
                        if (user) {
                          user.share_count = data.remaining_credits;
                        }

                        // Refresh data
                        await fetchMySubmissions();
                        await fetchUserStats();
                      } catch (error) {
                        console.error("Error unlocking content:", error);
                        toast.error(
                          error.message || "Failed to unlock content",
                        );
                      }
                    }}
                    className="w-full bg-black text-white text-sm font-bold py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span className="text-base">🚀</span>
                    Unlock & Go Live (1 credit)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-2xl p-6 text-center hover:border-black transition mx-6 sm:mx-8 lg:mx-10">
        <div className="emoji-3d inline-block mb-3">🎨</div>
        <h4 className="font-bold text-lg mb-2">
          Ready to share something new?
        </h4>
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
          Your content enters the discovery queue for creators who match your
          target audience. No credits needed!
        </p>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 mx-auto shadow-lg"
        >
          <Link2 className="w-5 h-5" />
          Submit New Content
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const unreadMessagesCount = allConversations.reduce(
    (sum, convo) => sum + (convo.unread_count || 0),
    0,
  );

  return (
    <ErrorBoundary>
      <style>{scrollbarStyles}</style>
      <div className="h-screen w-full bg-white flex overflow-hidden">
        {showWelcome ? (
          <WelcomeScreen />
        ) : (
          <>
            <Sidebar />

            <main className="flex-1 overflow-y-auto pool-scroll">
              {activeTab === "discover" && <DiscoverTab />}
              {activeTab === "collaborate" && <CollaborateTab />}
              {activeTab === "ai-insights" && (
                <AIInsightsTab
                  user={user}
                  genesisMetrics={genesisMetrics}
                  onSwitchToReview={() => setActiveTab("discover")}
                />
              )}
              {activeTab === "my-content" && <MyContentTab />}
            </main>
          </>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedCollabCreator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Message {selectedCollabCreator.creator}
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageText("");
                }}
                className="hover:bg-gray-100 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Introduce yourself and suggest a collaboration idea..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl resize-none focus:border-black focus:outline-none transition"
              rows="5"
            />

            <button
              onClick={() => {
                if (!messageText.trim()) {
                  toast.error("Please enter a message");
                  return;
                }
                const userId =
                  selectedCollabCreator.user_id || selectedCollabCreator.id;
                sendMessageToCreator(userId, messageText)
                  .then(() => {
                    toast.success("Message sent!");
                    setShowMessageModal(false);
                    setMessageText("");
                    setSelectedCollabCreator(null);
                  })
                  .catch((error) => {
                    toast.error(error.message || "Failed to send message");
                  });
              }}
              className="w-full bg-black text-white py-3 rounded-xl font-bold mt-4 hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* ✅ FIXED: Enhanced Messages Widget with loading states */}
      {showMessagesWidget && !showMessageThread && (
        <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-white rounded-2xl border-4 border-gray-900 shadow-2xl overflow-hidden z-50 flex flex-col">
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Messages
              {unreadMessagesCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full message-badge-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </h3>
            <button
              onClick={() => {
                setShowMessagesWidget(false);
                setShowMessageThread(false);
              }}
              className="hover:bg-white/20 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pool-scroll p-4 space-y-3 bg-gray-50">
            {isLoadingConversations ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold">
                  Loading conversations...
                </p>
              </div>
            ) : !Array.isArray(allConversations) ||
              allConversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="emoji-3d mb-4">📭</div>
                <p className="text-sm text-gray-600 mb-2 font-semibold">
                  No messages yet
                </p>
                <p className="text-xs text-gray-500">
                  Start collaborating to receive messages!
                </p>
              </div>
            ) : (
              allConversations.map((convo) => {
                if (!convo || !convo.thread_id) return null;

                return (
                  <div
                    key={convo.thread_id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-black transition-all cursor-pointer group"
                    onClick={async () => {
                      // ✅ FIXED: Comprehensive validation
                      if (!convo.other_user_id || !convo.thread_id) {
                        console.error("Invalid conversation data:", convo);
                        toast.error("Unable to open conversation");
                        return;
                      }

                      try {
                        console.log("🖱️ Opening conversation:", {
                          userId: convo.other_user_id,
                          username: convo.other_user_username,
                          threadId: convo.thread_id,
                        });

                        await fetchThreadMessages(convo.other_user_id);

                        // Mark as read
                        if (convo.unread_count > 0) {
                          try {
                            await markMessageAsRead(convo.thread_id);
                            await fetchAllConversations();
                          } catch (error) {
                            console.warn("Failed to mark as read:", error);
                          }
                        }

                        setShowMessageThread(true);
                      } catch (error) {
                        console.error("Error opening conversation:", error);
                        toast.error("Failed to load conversation");
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        {(
                          convo.other_user_username?.charAt(0) || "?"
                        ).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm truncate">
                            {convo.other_user_username || "Unknown User"}
                          </h4>
                          {(convo.unread_count || 0) > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                              {convo.unread_count}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {convo.last_message?.content || "No messages yet"}
                        </p>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {convo.last_message?.created_at
                              ? new Date(
                                  convo.last_message.created_at,
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Recently"}
                          </p>
                          <span className="text-xs text-gray-500">
                            {convo.total_messages || 0} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ✅ FIXED: Message Thread with loading states */}
      {showMessageThread && currentThread && (
        <div className="fixed bottom-6 right-6 w-[500px] h-[700px] bg-white rounded-2xl border-4 border-gray-900 shadow-2xl overflow-hidden z-50 flex flex-col">
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowMessageThread(false);
                  setCurrentThread(null);
                  setThreadMessages([]);
                }}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentThread.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {currentThread.username}
                </h3>
                <p className="text-xs text-gray-300">
                  {threadMessages.length} messages
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowMessageThread(false);
                setShowMessagesWidget(false);
                setCurrentThread(null);
              }}
              className="hover:bg-white/20 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pool-scroll p-4 space-y-3 bg-gray-50">
            {isLoadingThread ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold">
                  Loading messages...
                </p>
              </div>
            ) : threadMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="emoji-3d mb-4">💬</div>
                <p className="text-sm text-gray-600">No messages yet</p>
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isCurrentUser = msg.sender_id !== currentThread.userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isCurrentUser
                          ? "bg-black text-white rounded-br-none"
                          : "bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t-2 border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessageInThread();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:border-black focus:outline-none transition"
              />
              <button
                onClick={handleSendMessageInThread}
                disabled={!newMessage.trim()}
                className="bg-black text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedContent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto pool-scroll shadow-2xl border-4 border-gray-900">
            <div className="sticky top-0 bg-black text-white px-6 py-5 rounded-t-3xl flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <span className="text-2xl">💬</span>
                Give Feedback
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setCurrentStep(1);
                }}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
              <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`step-indicator flex items-center gap-2 ${
                      currentStep >= step ? "active" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        currentStep >= step
                          ? "bg-black text-white scale-110"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <ChevronRight
                        className={`w-4 h-4 ${
                          currentStep > step ? "text-black" : "text-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-600 mt-2">
                {currentStep === 1 && "Visit their content"}
                {currentStep === 2 && "Read & engage"}
                {currentStep === 3 && "Share your thoughts"}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-200">
                <div
                  className={`w-16 h-16 ${selectedContent.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg`}
                >
                  {(() => {
                    const name = selectedContent.creator || "User";
                    const initials = name
                      .split(" ")
                      .filter((n) => n.length > 0)
                      .map((n) => n[0]?.toUpperCase() || "")
                      .join("")
                      .substring(0, 2);
                    return initials || "U";
                  })()}
                </div>
                <div>
                  <h4 className="font-bold text-lg">
                    {selectedContent.creator}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedContent.creatorBio}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedContent.followers} followers
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base mb-2">
                  {selectedContent.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {selectedContent.description}
                </p>
              </div>

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-2xl p-5 text-center">
                    <div className="text-5xl mb-3">🚀</div>
                    <h5 className="font-bold text-lg mb-2">
                      Step 1: Visit Their Content
                    </h5>
                    <p className="text-sm text-gray-600 mb-4">
                      Click below to open their website in a new tab. Take your
                      time and genuinely engage with their work.
                    </p>
                    <button
                      onClick={handleVisitLink}
                      className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Visit Their Website
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-center text-gray-500">
                    No timers, no forced stays. Just read if you're genuinely
                    interested! ✨
                  </p>
                </div>
              )}

              {currentStep === 2 && !hasVisited && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-3 emoji-3d">📖</div>
                    <h5 className="font-bold text-lg mb-2">
                      Take Your Time Reading
                    </h5>
                    <p className="text-sm text-gray-600 mb-4">
                      Spend a moment with their content. We'll enable feedback
                      once you've had time to engage.
                    </p>
                    <div className="bg-white rounded-full p-4 border-2 border-gray-300">
                      <div className="text-4xl font-bold text-black">
                        {timeRemaining}s
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Verifying visit...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasVisited && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-black to-gray-800 text-white border-2 border-gray-900 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    <p className="text-sm font-semibold">
                      Thanks for reading! Now share your honest thoughts.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold mb-3 flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      Would you follow this creator?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setFeedback((prev) => ({
                            ...prev,
                            wouldFollow: true,
                          }))
                        }
                        className={`flex-1 py-4 rounded-xl font-bold text-base transition-all duration-300 border-2 ${
                          feedback.wouldFollow === true
                            ? "bg-black text-white border-black shadow-lg scale-105"
                            : "bg-white text-gray-700 border-gray-300 hover:border-black"
                        }`}
                      >
                        👍 Yes, I'd follow
                      </button>
                      <button
                        onClick={() =>
                          setFeedback((prev) => ({
                            ...prev,
                            wouldFollow: false,
                          }))
                        }
                        className={`flex-1 py-4 rounded-xl font-bold text-base transition-all duration-300 border-2 ${
                          feedback.wouldFollow === false
                            ? "bg-gray-600 text-white border-gray-600 shadow-lg scale-105"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-600"
                        }`}
                      >
                        👎 Not my thing
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold mb-3 flex items-center gap-2">
                      <span className="text-xl">💭</span>
                      Did this content resonate with you?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "🔥 Loved it", value: "🔥 Loved it" },
                        { label: "👍 Good", value: "👍 Good" },
                        { label: "😐 Okay", value: "😐 Okay" },
                        { label: "👎 Not for me", value: "👎 Not for me" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            setFeedback((prev) => ({
                              ...prev,
                              resonates: option.value,
                            }))
                          }
                          className={`py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                            feedback.resonates === option.value
                              ? "bg-black text-white border-black shadow-lg scale-105"
                              : "bg-white text-gray-700 border-gray-300 hover:border-black"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold mb-2 flex items-center gap-2">
                      <span className="text-xl">✍️</span>
                      Any specific feedback? (Optional)
                    </p>
                    <textarea
                      value={feedback.notes}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="What did you like? What could be better? Be honest but kind."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm resize-none focus:border-black focus:outline-none transition"
                      rows="3"
                    />
                  </div>

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={
                      feedback.wouldFollow === null || !feedback.resonates
                    }
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-base hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                  >
                    <span className="text-xl">✨</span>
                    Submit Feedback
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    Your honest feedback helps them improve and grow 🌱
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto pool-scroll shadow-2xl border-4 border-gray-900">
            <div className="sticky top-0 bg-black text-white px-6 py-5 rounded-t-3xl flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Submit Your Content
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitContent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Title *
                </label>
                <input
                  type="text"
                  value={newSubmission.title}
                  onChange={(e) =>
                    setNewSubmission((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:border-black focus:outline-none transition"
                  placeholder="Eye-catching title for your content..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  URL *
                </label>
                <input
                  type="url"
                  value={newSubmission.url}
                  onChange={(e) =>
                    setNewSubmission((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:border-black focus:outline-none transition"
                  placeholder="https://your-content-url.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Category *
                </label>
                <select
                  value={newSubmission.category}
                  onChange={(e) =>
                    setNewSubmission((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:border-black focus:outline-none transition"
                  required
                >
                  <option value="">Select category...</option>
                  <option value="Productivity">📊 Productivity</option>
                  <option value="Technology">💻 Technology</option>
                  <option value="Business">💼 Business</option>
                  <option value="Health">🏃 Health</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Pitch (Optional)
                </label>
                <textarea
                  value={newSubmission.pitch}
                  onChange={(e) =>
                    setNewSubmission((prev) => ({
                      ...prev,
                      pitch: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm resize-none focus:border-black focus:outline-none transition"
                  rows="3"
                  placeholder="Why should people read this? What value does it provide?"
                />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 text-sm">
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-xl">🎯</span>
                  <span>
                    <strong className="text-black">How it works:</strong> Your
                    content starts as <strong>pending</strong>. Review other
                    creators' work to earn credits. Each review unlocks one of
                    your pending submissions to the discovery queue!
                  </span>
                </p>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <span>💡</span>
                    <span>
                      Current credits: <strong>{user?.share_count || 0}</strong>
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-base hover:bg-gray-800 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                <span className="text-xl">🚀</span>
                Submit for Discovery
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto pool-scroll shadow-2xl border-4 border-gray-900">
            <div className="sticky top-0 bg-black text-white px-6 py-5 rounded-t-3xl flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                How It Works
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-gray-700 font-semibold text-center">
                Find your first 100 true fans through genuine discovery and
                authentic connections.
              </p>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-300 p-5 text-center">
                <div className="text-5xl mb-3">💡</div>
                <h4 className="font-bold text-base mb-2">The Core Concept</h4>
                <p className="text-sm text-gray-700">
                  We match you with creators at similar growth stages who share
                  your niche. Discover content you'd genuinely follow, and your
                  content gets shown to people who might actually follow you.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    emoji: "🔍",
                    title: "Discover Aligned Creators",
                    desc: "See content matched to your interests and audience size. No forced reviews—only engage with what genuinely resonates.",
                  },
                  {
                    emoji: "💬",
                    title: "Give Honest Feedback",
                    desc: "Visit content you like and share genuine thoughts. Help creators improve while finding your future collaborators.",
                  },
                  {
                    emoji: "📝",
                    title: "Submit Your Content",
                    desc: "Share your work for free. It gets shown to creators who match your target audience—no credits needed.",
                  },
                  {
                    emoji: "🤝",
                    title: "Find Collaboration Partners",
                    desc: "Connect with creators at similar stages. Co-create content, swap mentions, or start a podcast together.",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-200 hover:border-black transition"
                  >
                    <div className="text-4xl flex-shrink-0">{step.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                      <p className="text-xs text-gray-700">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl border-2 border-gray-900 p-5">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  What Makes This Different
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    • No forced engagement - Only interact with content you like
                  </p>
                  <p>• Smart matching - Aligned by niche and audience size</p>
                  <p>• Free to use - No credit system, no barriers</p>
                  <p>
                    • Quality over quantity - Find 100 true fans, not 10,000
                    random followers
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                <span className="text-xl">🚀</span>
                Got it! Let's start
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default PoolFeature;
