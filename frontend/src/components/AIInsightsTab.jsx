// frontend/src/components/AIInsightsTab.jsx

// frontend/src/components/AIInsightsTab.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Target,
  ChevronRight,
  CheckCircle2,
  Zap,
  Users,
  Award,
  BarChart3,
  Star,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  X,
  Send,
  ExternalLink,
  User,
  Mail,
  Calendar,
  Activity,
  UserPlus,
} from "lucide-react";
import { useApi } from "../lib/api";

function AIInsightsTab({ onSwitchToReview, genesisMetrics }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showIcebreakerModal, setShowIcebreakerModal] = useState(false);
  const [generatingIcebreaker, setGeneratingIcebreaker] = useState(false);
  const [icebreakers, setIcebreakers] = useState([]);
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isFollowing, setIsFollowing] = useState(null);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Track contacted matches in localStorage
  const CONTACTED_MATCHES_KEY = "ai_insights_contacted_matches";
  const [contactedMatches, setContactedMatches] = useState(() => {
    const stored = localStorage.getItem(CONTACTED_MATCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // API hooks
  const {
    getCollaborationMatches,
    getProfile,
    sendMessageToCreator,
    followCreator,
  } = useApi();

  // State for real data
  const [profileScore, setProfileScore] = useState({
    overall: 0,
    breakdown: {
      reviews: 0,
      engagement: 0,
      quality: 0,
      consistency: 0,
    },
    improvements: [],
  });

  const [smartMatches, setSmartMatches] = useState([]);
  const [quickStats, setQuickStats] = useState({
    potentialMatches: 0,
    reviewsGiven: 0,
    connections: 0,
  });

  // Use genesisMetrics from props
  useEffect(() => {
    if (genesisMetrics) {
      // Calculate profile score from genesis metrics
      const reviewScore = Math.min(
        (genesisMetrics.total_reviews_given || 0) * 10,
        100,
      );
      const engagementScore = Math.min(
        (genesisMetrics.connections || 0) * 15,
        100,
      );
      const qualityScore = Math.min(genesisMetrics.quality_score || 0, 100);
      const consistencyScore = Math.min(
        (genesisMetrics.day_streak || 0) * 5,
        100,
      );

      setProfileScore({
        overall: Math.round(
          (reviewScore + engagementScore + qualityScore + consistencyScore) / 4,
        ),
        breakdown: {
          reviews: reviewScore,
          engagement: engagementScore,
          quality: qualityScore,
          consistency: consistencyScore,
        },
        improvements: generateImprovements(genesisMetrics),
      });

      setQuickStats({
        potentialMatches: genesisMetrics.active_collabs || 0,
        reviewsGiven: genesisMetrics.total_reviews_given || 0,
        connections: genesisMetrics.connections || 0,
      });

      // Only fetch matches data
      fetchMatchesData();
      setLoading(false);
    }
  }, [genesisMetrics]);

  // Persist contacted matches to localStorage
  useEffect(() => {
    localStorage.setItem(
      CONTACTED_MATCHES_KEY,
      JSON.stringify(contactedMatches),
    );
  }, [contactedMatches]);

  const fetchMatchesData = async () => {
    try {
      const matches = await getCollaborationMatches(10);

      if (!matches || matches.length === 0) {
        setSmartMatches([]);
        return;
      }

      const enrichedMatches = matches
        .slice(0, 3)
        .map((match) => ({
          id: match.id,
          userId: match.user_id,
          submissionId: match.id,

          name: match.username || "Anonymous Creator",
          role: match.niche || match.category || "Content Creator",
          avatar: match.avatar_initials || "AC",
          bio: match.bio,

          matchScore: match.collab_score || 75,
          reasoning: [
            match.match_reason,
            match.collab_idea,
            `${match.review_count || 0} reviews given`,
            `${match.content_count || 0} pieces of content`,
            match.would_follow_count > 0
              ? `${match.would_follow_count} potential followers`
              : null,
          ].filter(Boolean),

          strengths: [
            match.collab_score > 80
              ? "High compatibility"
              : match.collab_score > 60
                ? "Good match"
                : "Potential match",
            match.niche ? "Same niche" : "Complementary niche",
            match.review_count > 10
              ? "Very active"
              : match.review_count > 5
                ? "Active reviewer"
                : "Growing presence",
            match.avg_rating >= 4.0 ? "High quality content" : null,
          ].filter(Boolean),

          recentWork: match.title || "Recent work",
          engagement:
            match.review_count > 10 ? "Very active" : "Moderate activity",

          originalUrl: match.original_url,
          category: match.category,
          avgRating: match.avg_rating || 0,
        }))
        .filter((match) => !contactedMatches.includes(match.id));

      setSmartMatches(enrichedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load collaboration matches", {
        position: "top-center",
        autoClose: 4000,
      });
    }
  };

  const generateImprovements = (metricsData) => {
    const improvements = [];

    if (metricsData.total_reviews_given < 5) {
      improvements.push({
        id: 1,
        priority: "high",
        title: "Review more content",
        description: `You've given ${metricsData.total_reviews_given || 0} reviews. Aim for 10+ to discover great creators.`,
        impact: `+${(5 - (metricsData.total_reviews_given || 0)) * 10} points`,
        action: "Start reviewing",
        onClick: () => {
          if (onSwitchToReview) {
            onSwitchToReview();
            toast.success("Switched to Review tab", {
              position: "top-center",
              autoClose: 2000,
            });
          }
        },
      });
    }

    if (metricsData.would_follow_count === 0) {
      improvements.push({
        id: 2,
        priority: "high",
        title: "Submit your first content",
        description: "Get discovered by other creators in the Pool.",
        impact: "+25 points",
        action: "Submit now",
        onClick: () => {
          if (onSwitchToReview) {
            onSwitchToReview();
            toast.info("Switch to Submit tab to share your content", {
              position: "top-center",
              autoClose: 3000,
            });
          }
        },
      });
    }

    if (metricsData.genuine_connections < 3) {
      improvements.push({
        id: 3,
        priority: "medium",
        title: "Leave detailed feedback",
        description: `You have ${metricsData.genuine_connections || 0} meaningful connections. Quality feedback builds relationships.`,
        impact: "+15 points per connection",
        action: "Review now",
        onClick: () => {
          if (onSwitchToReview) {
            onSwitchToReview();
            toast.success("Switched to Review tab", {
              position: "top-center",
              autoClose: 2000,
            });
          }
        },
      });
    }

    if (metricsData.streak_days === 0) {
      improvements.push({
        id: 4,
        priority: "medium",
        title: "Build a review streak",
        description: "Consistent daily reviews increase visibility.",
        impact: "+20 points",
        action: "Start today",
        onClick: () => {
          if (onSwitchToReview) {
            onSwitchToReview();
            toast.success("Switched to Review tab", {
              position: "top-center",
              autoClose: 2000,
            });
          }
        },
      });
    }

    return improvements;
  };

  const handleGenerateIcebreaker = async (match) => {
    setGeneratingIcebreaker(true);
    setSelectedMatch(match);

    try {
      const templates = generateIcebreakerTemplates(match);

      setIcebreakers([
        {
          id: match.id,
          matchId: match.id,
          name: match.name,
          matchScore: match.matchScore,
          matchQuality: match.matchScore > 80 ? "high" : "good",

          templates: templates,

          commonTopics: extractCommonTopics(match),
          collabIdeas: generateCollabIdeas(match),
        },
      ]);

      setShowIcebreakerModal(true);
      toast.success("✓ Generated personalized icebreakers!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Failed to generate icebreaker:", error);
      toast.error("Failed to generate icebreakers. Please try again.", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setGeneratingIcebreaker(false);
    }
  };

  const generateIcebreakerTemplates = (match) => {
    const templates = [];

    templates.push({
      id: 1,
      text: `Hey ${match.name}! I came across your work "${match.recentWork}" and was really impressed by your approach to ${match.role.toLowerCase()}. Your match score with my content is ${match.matchScore}% - would love to explore potential collaboration opportunities!`,
      reason: "Enthusiastic and specific to their work",
      tone: "Enthusiastic",
    });

    templates.push({
      id: 2,
      text: `Hi ${match.name}, I noticed we both focus on ${match.role.toLowerCase()} and have similar creative approaches. Given our ${match.matchScore}% compatibility score, I think we could create something valuable together. Are you open to discussing collaboration ideas?`,
      reason: "Professional and data-driven",
      tone: "Professional",
    });

    templates.push({
      id: 3,
      text: `${match.name}, your "${match.recentWork}" caught my attention. I'm working on similar projects in ${match.category || match.role.toLowerCase()} and see strong synergy potential. Quick chat to explore collaboration?`,
      reason: "Direct and action-oriented",
      tone: "Direct",
    });

    return templates;
  };

  const extractCommonTopics = (match) => {
    const topics = [];

    if (match.category) topics.push(match.category);
    if (match.role && match.role !== match.category) topics.push(match.role);

    if (match.matchScore > 80) {
      topics.push("High-quality content");
      topics.push("Active collaboration");
    }

    return topics.slice(0, 4);
  };

  const generateCollabIdeas = (match) => {
    const ideas = [];

    if (match.avgRating >= 4.0) {
      ideas.push(
        `Co-create premium content leveraging both your expertise in ${match.role.toLowerCase()}`,
      );
    }

    if (match.engagement === "Very active") {
      ideas.push("Cross-promote each other's work to expand both audiences");
    }

    ideas.push(
      `Joint project in ${match.category || match.role.toLowerCase()} combining your unique perspectives`,
    );

    if (match.matchScore > 80) {
      ideas.push(
        "Long-term partnership with regular content exchanges and feedback",
      );
    }

    return ideas;
  };

  const handleCopyTemplate = (templateId) => {
    const icebreaker = icebreakers[0];
    const template = icebreaker.templates.find((t) => t.id === templateId);

    if (template) {
      navigator.clipboard.writeText(template.text);
      setCopiedTemplate(templateId);
      toast.success("✓ Copied to clipboard!", {
        position: "top-center",
        autoClose: 2000,
      });

      setTimeout(() => setCopiedTemplate(null), 2000);
    }
  };

  const markMatchAsContacted = (matchId) => {
    setContactedMatches((prev) => {
      if (!prev.includes(matchId)) {
        return [...prev, matchId];
      }
      return prev;
    });
  };

  const handleSendMessage = async (templateId) => {
    const icebreaker = icebreakers[0];
    const template = icebreaker.templates.find((t) => t.id === templateId);

    if (!template) {
      toast.error("Template not found", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (!selectedMatch?.userId) {
      toast.error("Cannot send message: User ID not found", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setSendingMessage(true);

    try {
      await sendMessageToCreator(selectedMatch.userId, template.text);

      toast.success(`✓ Message sent to ${selectedMatch.name}!`, {
        position: "top-center",
        autoClose: 3000,
      });

      markMatchAsContacted(selectedMatch.id);

      setSmartMatches((prevMatches) =>
        prevMatches.filter((m) => m.id !== selectedMatch.id),
      );

      setShowIcebreakerModal(false);
      setSelectedMatch(null);
      setIcebreakers([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(error.message || "Failed to send message", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMatchesData();
      toast.success("✓ Insights refreshed!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Failed to refresh insights", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewContent = (match) => {
    if (!match.originalUrl) {
      toast.error("Content URL not available", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const newWindow = window.open(
      match.originalUrl,
      "_blank",
      "noopener,noreferrer",
    );

    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === "undefined"
    ) {
      toast.error("Please allow popups to view content", {
        position: "top-center",
        autoClose: 3000,
      });
      navigator.clipboard.writeText(match.originalUrl);
      toast.info("URL copied to clipboard", {
        position: "top-center",
        autoClose: 2000,
      });
    } else {
      toast.success("✓ Content opened in new tab", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const handleViewProfile = async (match) => {
    if (!match.userId) {
      toast.error("User profile not available", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setLoadingProfile(true);
    setShowProfileModal(true);

    try {
      console.log("🔍 Fetching profile for user ID:", match.userId);
      const profile = await getProfile(match.userId);

      console.log("✅ Profile fetched:", profile);

      setProfileData({
        ...profile,
        matchScore: match.matchScore,
        recentWork: match.recentWork,
        engagement: match.engagement,
        strengths: match.strengths,
      });

      toast.success(`✓ Viewing ${match.name}'s profile`, {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      toast.error("Failed to load profile", {
        position: "top-center",
        autoClose: 4000,
      });
      setShowProfileModal(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setProfileData(null);
  };

  const handleFollow = async (match) => {
    if (!match.userId) {
      toast.error("Cannot follow: User ID not found", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setIsFollowing(match.id);

    try {
      await followCreator(match.userId);

      toast.success(`✓ Now following ${match.name}!`, {
        position: "top-center",
        autoClose: 3000,
      });

      markMatchAsContacted(match.id);

      setSmartMatches((prevMatches) =>
        prevMatches.filter((m) => m.id !== match.id),
      );
    } catch (error) {
      console.error("Error following user:", error);
      toast.error(error.message || "Failed to follow user", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setIsFollowing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">
            Analyzing your data...
          </p>
          <p className="text-sm text-gray-500">
            Preparing personalized insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        .ai-insights-tab * {
          font-family: 'Space Mono', monospace;
        }

        @keyframes success-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .success-animation {
          animation: success-pulse 0.3s ease-in-out;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .toast-enter {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>

      <div className="ai-insights-tab">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI Insights
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Personalized recommendations powered by real data
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              {
                id: "overview",
                label: "Profile Intelligence",
                icon: BarChart3,
              },
              { id: "matches", label: "Collaboration Matches", icon: Users },
              {
                id: "performance",
                label: "Content Performance",
                icon: TrendingUp,
              },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* Profile Score Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Pool Activity Score
                    </h2>
                    <p className="text-gray-600">
                      Based on your reviews, connections, and engagement
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - profileScore.overall / 100)}`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute">
                        <div className="text-3xl font-bold text-gray-900">
                          {profileScore.overall}
                        </div>
                        <div className="text-xs text-gray-500">/ 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {Object.entries(profileScore.breakdown).map(
                    ([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-600 capitalize mb-1">
                          {key}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="text-2xl font-bold text-gray-900">
                            {value}
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            / 100
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {/* Improvements */}
                {profileScore.improvements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Recommended Actions
                    </h3>
                    <div className="space-y-3">
                      {profileScore.improvements.map((improvement) => (
                        <div
                          key={improvement.id}
                          className={`border rounded-xl p-4 ${getPriorityColor(improvement.priority)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {improvement.title}
                                </h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50">
                                  {improvement.priority}
                                </span>
                              </div>
                              <p className="text-sm mb-2">
                                {improvement.description}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium">
                                  Impact: {improvement.impact}
                                </span>
                                <button
                                  onClick={improvement.onClick}
                                  className="text-xs font-medium underline hover:no-underline"
                                >
                                  {improvement.action} →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {quickStats.potentialMatches}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Active creators in Pool
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {quickStats.reviewsGiven}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Reviews given</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {quickStats.connections}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Quality connections
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Matches Section */}
          {activeSection === "matches" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-bold text-gray-900">
                    AI-Curated Matches
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Based on Pool activity, content style, and collaboration
                  potential
                </p>

                {smartMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No matches yet. Review more content to find collaborators!
                    </p>
                    <button
                      onClick={() => {
                        if (onSwitchToReview) {
                          onSwitchToReview();
                          toast.success("Switched to Review tab", {
                            position: "top-center",
                            autoClose: 2000,
                          });
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                    >
                      Start Reviewing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {smartMatches.map((match) => (
                      <div
                        key={match.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {match.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900">
                                {match.name}
                              </h3>
                              <p className="text-gray-600">{match.role}</p>
                              {match.bio && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {match.bio}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {match.strengths.map((strength, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium"
                                  >
                                    {strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              {match.matchScore}%
                            </div>
                            <div className="text-xs text-gray-500">match</div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Why this match?
                            </h4>
                          </div>
                          <ul className="space-y-1 ml-6">
                            {match.reasoning.map((reason, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-700 list-disc"
                              >
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          <div className="text-sm">
                            <span className="text-gray-600">Recent work:</span>
                            <span className="text-gray-900 font-medium ml-1">
                              {match.recentWork}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Engagement:</span>
                            <span className="text-green-600 font-medium ml-1">
                              {match.engagement}
                            </span>
                          </div>
                          {match.avgRating > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-600">Rating:</span>
                              <span className="text-yellow-600 font-medium ml-1 inline-flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                {match.avgRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleGenerateIcebreaker(match)}
                            disabled={generatingIcebreaker}
                            className="flex-1 min-w-[200px] px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingIcebreaker &&
                            selectedMatch?.id === match.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Icebreaker
                              </>
                            )}
                          </button>

                          {match.originalUrl && (
                            <button
                              onClick={() => handleViewContent(match)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Content
                            </button>
                          )}

                          <button
                            onClick={() => handleFollow(match)}
                            disabled={isFollowing === match.id}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFollowing === match.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Following...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                Follow
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Performance Section */}
          {activeSection === "performance" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Your Content Performance
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  How your content is performing in the Pool
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-purple-700 font-medium">
                        Total Reviews
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                      {genesisMetrics?.total_reviews_received || 0}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">
                        Would Follow
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                      {genesisMetrics?.would_follow_count || 0}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        Conversion Rate
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-green-900">
                      {genesisMetrics?.total_reviews_received > 0
                        ? Math.round(
                            (genesisMetrics.would_follow_count /
                              genesisMetrics.total_reviews_received) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Detailed content analytics coming soon!</p>
                  <p className="text-sm mt-1">
                    Track individual post performance, engagement trends, and
                    more.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Icebreaker Modal */}
        {showIcebreakerModal && icebreakers.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Icebreaker Templates
                    </h2>
                    <p className="text-sm text-gray-600">
                      Personalized for {icebreakers[0].name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowIcebreakerModal(false);
                    setIcebreakers([]);
                    setSelectedMatch(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* Match Quality Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Match Quality
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {icebreakers[0].matchScore}% Compatible
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        Match Type
                      </div>
                      <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                        {icebreakers[0].matchQuality} match
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Topics */}
                {icebreakers[0].commonTopics.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Common Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {icebreakers[0].commonTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Message Templates
                  </h3>
                  {icebreakers[0].templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                              {template.tone}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed mb-2">
                            {template.text}
                          </p>
                          <p className="text-xs text-gray-500 italic">
                            {template.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyTemplate(template.id)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          {copiedTemplate === template.id ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleSendMessage(template.id)}
                          disabled={sendingMessage}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingMessage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collaboration Ideas */}
                {icebreakers[0].collabIdeas.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      💡 Collaboration Ideas
                    </h3>
                    <ul className="space-y-2">
                      {icebreakers[0].collabIdeas.map((idea, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Creator Profile
                </h2>
                <button
                  onClick={handleCloseProfileModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {loadingProfile ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading profile...</p>
                  </div>
                ) : profileData ? (
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {profileData.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {profileData.username || "Anonymous Creator"}
                        </h3>
                        {profileData.bio && (
                          <p className="text-gray-600 mb-3">
                            {profileData.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {profileData.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {profileData.email}
                            </div>
                          )}
                          {profileData.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Joined{" "}
                              {new Date(
                                profileData.created_at,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    {profileData.matchScore && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">
                              Compatibility Score
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                              {profileData.matchScore}%
                            </div>
                          </div>
                          {profileData.strengths && (
                            <div className="flex flex-wrap gap-2 max-w-xs">
                              {profileData.strengths.map((strength, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      {profileData.recentWork && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            Recent Work
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {profileData.recentWork}
                          </div>
                        </div>
                      )}
                      {profileData.engagement && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            Engagement
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            {profileData.engagement}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Profile Info */}
                    {(profileData.niche ||
                      profileData.category ||
                      profileData.social_links) && (
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Additional Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {profileData.niche && (
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Niche:</span>
                              <span className="text-gray-900 font-medium">
                                {profileData.niche}
                              </span>
                            </div>
                          )}
                          {profileData.category && (
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Category:</span>
                              <span className="text-gray-900 font-medium">
                                {profileData.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No profile data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIInsightsTab;
