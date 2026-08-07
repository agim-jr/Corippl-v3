// frontend/src/contexts/AuthProvider.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { decodeJWT } from "@/lib/decodeJWT";
import { toast } from "react-toastify";
import { BASE_URL } from "../lib/api";

async function fetchCurrentUser() {
  const token = localStorage.getItem("token");
  console.log("fetchCurrentUser - Retrieved Token:", token);

  if (!token) {
    console.error("fetchCurrentUser - No token found.");
    throw new Error("No token found");
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("fetchCurrentUser - Response Status:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("fetchCurrentUser - Error Response:", errorData);
      throw new Error("Failed to fetch user");
    }

    const data = await res.json();
    console.log("fetchCurrentUser - Fetched User Data:", data);
    console.log("fetchCurrentUser - is_premium value:", data.is_premium);
    console.log("fetchCurrentUser - is_ai_tier value:", data.is_ai_tier);
    return data;
  } catch (error) {
    console.error("fetchCurrentUser - Fetch Error:", error);
    throw error;
  }
}

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpirationTime, setTokenExpirationTime] = useState(null);
  const logoutTimerRef = useRef(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      console.log("=== AUTH INITIALIZATION ===");
      console.log("Stored Token:", storedToken ? "EXISTS" : "NONE");
      console.log("Stored User:", storedUser);

      if (storedToken) {
        setToken(storedToken);

        try {
          // ✅ ALWAYS fetch fresh user data from backend
          console.log("Fetching fresh user data from /auth/me...");
          const freshUser = await fetchCurrentUser();

          console.log("Fresh user data received:", freshUser);
          console.log("is_admin value:", freshUser.is_admin);
          console.log("is_premium value:", freshUser.is_premium); // ✅ ADDED
          console.log("is_ai_tier value:", freshUser.is_ai_tier); // ✅ ADDED

          // ✅ ENHANCED: Ensure all premium-related fields are present
          const enhancedUser = {
            ...freshUser,
            // Explicitly map these fields to ensure they exist
            is_premium: freshUser.is_premium === true,
            is_ai_tier: freshUser.is_ai_tier === true,
            autopilot_enabled: freshUser.autopilot_enabled === true,
            autopilot_settings: freshUser.autopilot_settings || {
              schedule_preference: "optimal",
              max_daily_shares: 5,
              content_quality_threshold: 70,
              target_audience_size: "medium",
            },
          };

          setUser(enhancedUser);
          localStorage.setItem("user", JSON.stringify(enhancedUser));

          console.log("✅ Enhanced user set:", enhancedUser);
          console.log("✅ is_admin FINAL:", enhancedUser.is_admin);
          console.log("✅ is_premium FINAL:", enhancedUser.is_premium); // ✅ ADDED
          console.log("✅ is_ai_tier FINAL:", enhancedUser.is_ai_tier); // ✅ ADDED

          // Handle tour status
          if (enhancedUser.id) {
            let storedTourStatus = localStorage.getItem(
              `hasCompletedTour-${enhancedUser.id}`,
            );

            if (storedTourStatus === null) {
              localStorage.setItem(
                `hasCompletedTour-${enhancedUser.id}`,
                "false",
              );
              storedTourStatus = "false";
            }

            setHasCompletedTour(storedTourStatus === "true");
          }

          // Set logout timer
          const decodedToken = decodeJWT(storedToken);
          if (decodedToken.exp) {
            setLogoutTimer(decodedToken.exp);
          }
        } catch (error) {
          console.error("❌ Failed to fetch user from backend:", error);

          // ⚠️ FALLBACK: Try to use stored user
          if (storedUser && storedUser !== "undefined") {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log(
                "Using cached user (backend unavailable):",
                parsedUser,
              );
              console.log("Cached is_admin:", parsedUser.is_admin);
              console.log("Cached is_premium:", parsedUser.is_premium); // ✅ ADDED
              setUser(parsedUser);
            } catch (parseError) {
              console.error("Failed to parse stored user:", parseError);
              localStorage.removeItem("user");
              logout();
            }
          } else {
            console.log("No stored user available, logging out");
            logout();
          }
        }
      } else {
        console.log("No token found, user not authenticated");
        setUser(null);
      }

      setLoading(false);
      console.log("=== AUTH INITIALIZATION COMPLETE ===");
    };

    initializeAuth();

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  const completeTour = () => {
    if (user && user.id) {
      try {
        setHasCompletedTour(true);
        localStorage.setItem(`hasCompletedTour-${user.id}`, "true");
        toast.success("Tour marked as completed!");
        console.log(
          `completeTour - Tour marked as completed for user ID: ${user.id}`,
        );
      } catch (error) {
        console.error(
          "completeTour - Failed to set hasCompletedTour flag:",
          error,
        );
        toast.error("Failed to mark tour as completed.");
      }
    } else {
      console.warn("completeTour - User is not defined.");
    }
  };

  const resetTour = useCallback(() => {
    if (user && user.id) {
      setHasCompletedTour(false);
      localStorage.removeItem(`hasCompletedTour-${user.id}`);
      toast.info("Tour has been reset. You can retake the tour.");
      console.log(`resetTour - Tour has been reset for user ID: ${user.id}`);
    }
  }, [user]);

  const calculateRemainingTime = (exp) => {
    const currentTime = Date.now();
    const expTime = exp * 1000;
    const remainingTime = expTime - currentTime;
    return remainingTime;
  };

  const setLogoutTimer = (exp) => {
    const remainingTime = calculateRemainingTime(exp);

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    logoutTimerRef.current = setTimeout(() => {
      logout();
      toast.info("Session expired. Please log in again.");
    }, remainingTime);
  };

  const login = (newToken, newUser) => {
    if (newToken && newUser) {
      try {
        // ✅ ENHANCED: Explicitly ensure premium fields are boolean
        const enhancedUser = {
          ...newUser,
          is_premium: newUser.is_premium === true,
          is_ai_tier: newUser.is_ai_tier === true,
          autopilot_enabled: newUser.autopilot_enabled === true,
          autopilot_settings: newUser.autopilot_settings || {
            schedule_preference: "optimal",
            max_daily_shares: 5,
            content_quality_threshold: 70,
            target_audience_size: "medium",
          },
        };

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(enhancedUser));
        setToken(newToken);
        setUser(enhancedUser);

        console.log("✅ Login - Token and User set:", {
          token: newToken,
          user: enhancedUser,
        });
        console.log("✅ Login - is_premium:", enhancedUser.is_premium); // ✅ ADDED
        console.log("✅ Login - is_ai_tier:", enhancedUser.is_ai_tier); // ✅ ADDED

        // Initialize tour status
        const tourStatus = localStorage.getItem(
          `hasCompletedTour-${enhancedUser.id}`,
        );
        if (tourStatus === null) {
          localStorage.setItem(`hasCompletedTour-${enhancedUser.id}`, "false");
          setHasCompletedTour(false);
        } else {
          setHasCompletedTour(tourStatus === "true");
        }

        try {
          const decodedToken = decodeJWT(newToken);
          if (decodedToken.exp) {
            setLogoutTimer(decodedToken.exp);
            console.log("Login - Token Expiration Time:", decodedToken.exp);
          }
        } catch (error) {
          console.error("Failed to decode token during login:", error);
        }
      } catch (error) {
        console.error("Failed to save auth data to localStorage:", error);
      }
    } else {
      console.error("Invalid token or user data provided to login");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);

    console.log("Logout - Token and User cleared from State and localStorage.");
    console.log(
      "Remaining localStorage keys after logout:",
      Object.keys(localStorage),
    );

    navigate("/login");

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await fetchCurrentUser();

      // ✅ ENHANCED: Explicitly ensure premium fields are boolean
      const enhancedUser = {
        ...currentUser,
        is_premium: currentUser.is_premium === true,
        is_ai_tier: currentUser.is_ai_tier === true,
        autopilot_enabled: currentUser.autopilot_enabled === true,
        autopilot_settings: currentUser.autopilot_settings || {
          schedule_preference: "optimal",
          max_daily_shares: 5,
          content_quality_threshold: 70,
          target_audience_size: "medium",
        },
      };

      setUser(enhancedUser);
      localStorage.setItem("user", JSON.stringify(enhancedUser));

      console.log("✅ refreshUser - User data refreshed:", enhancedUser);
      console.log("✅ refreshUser - is_premium:", enhancedUser.is_premium); // ✅ ADDED

      if (enhancedUser.id) {
        const tourStatus = localStorage.getItem(
          `hasCompletedTour-${enhancedUser.id}`,
        );
        setHasCompletedTour(tourStatus === "true");
      }

      return enhancedUser;
    } catch (error) {
      console.error("refreshUser - Failed to refresh user data:", error);
      toast.error("Failed to refresh user data.");
      logout();
      return null;
    }
  };

  const updateAISettings = (settings) => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        autopilot_settings: {
          ...user.autopilot_settings,
          ...settings,
        },
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log(
        "updateAISettings - AI settings updated:",
        updatedUser.autopilot_settings,
      );
    } catch (error) {
      console.error("updateAISettings - Failed to update AI settings:", error);
      toast.error("Failed to update AI settings.");
    }
  };

  const updateAITierStatus = (isAITier, isAutopilotEnabled = null) => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        is_ai_tier: isAITier,
        ...(isAutopilotEnabled !== null && {
          autopilot_enabled: isAutopilotEnabled,
        }),
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log(
        `updateAITierStatus - AI tier status updated: is_ai_tier=${isAITier}, autopilot_enabled=${
          isAutopilotEnabled !== null
            ? isAutopilotEnabled
            : user.autopilot_enabled
        }`,
      );
    } catch (error) {
      console.error(
        "updateAITierStatus - Failed to update AI tier status:",
        error,
      );
      toast.error("Failed to update AI tier status.");
    }
  };

  // ✅ CRITICAL FIX: Ensure these are always boolean
  const isAdmin = user?.is_admin === true;
  const isPremium = user?.is_premium === true;
  const isAITier = user?.is_ai_tier === true;
  const isAutopilotEnabled = user?.autopilot_enabled === true;

  // ✅ ENHANCED DEBUG LOGGING
  console.log("=== CONTEXT VALUES (LIVE) ===");
  console.log("User object:", user);
  console.log("isAdmin:", isAdmin);
  console.log("isPremium:", isPremium);
  console.log("isAITier:", isAITier);
  console.log("Token:", token ? "EXISTS" : "NONE");
  console.log("==============================");

  const contextValue = useMemo(
    () => ({
      token,
      user,
      isAdmin,
      isPremium,
      isAITier,
      isAutopilotEnabled,
      hasCompletedTour,
      completeTour,
      resetTour,
      login,
      logout,
      refreshUser,
      updateAISettings,
      updateAITierStatus,
    }),
    [
      token,
      user,
      isAdmin,
      isPremium,
      isAITier,
      isAutopilotEnabled,
      hasCompletedTour,
      resetTour,
    ],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
