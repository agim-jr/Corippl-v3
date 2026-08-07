import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import AIMatchesTab from "./AIMatchesTab";
import PremiumModal from "../components/PremiumModal";
import {
  Zap,
  Star,
  Award,
  ChevronRight,
  X,
  Send,
  MessageSquare,
  ThumbsUp,
  Plus,
  HelpCircle,
  Menu,
  ChevronLeft,
  Loader2,
  Lock,
  Brain,
  Check,
} from "lucide-react";

const scrollbarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }

  .main-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .main-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .main-scroll::-webkit-scrollbar-thumb:hover {
    background: #333;
  }
  .main-scroll::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 6px;
  }
  .main-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #f3f4f6;
  }

  .profile-modal-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .profile-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .profile-modal-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .profile-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }

  .emoji-3d {
    font-size: 3rem;
    filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.3));
    animation: float 3s ease-in-out infinite;
  }
`;

const QuickConnects = () => {
  const navigate = useNavigate();
  const { isPremium } = useContext(AuthContext);
  const api = useApi();

  const isPreview = !isPremium;

  // UI State
  const [activeTab, setActiveTab] = useState("board");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [helpGiven, setHelpGiven] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tokenBalance, setTokenBalance] = useState({
    balance: 0,
    reputation_score: 0,
    help_given_count: 0,
    help_received_count: 0,
  });

  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    category: null,
    urgency: null,
    minTokens: null,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Explicitly handle undefined/null isPremium
      const previewMode = isPremium === false; // Only false if explicitly false
      const [
        boardData,
        tokensData,
        leaderboardData,
        myRequestsData,
        helpGivenData,
      ] = await Promise.all([
        api.getQuickConnectBoard(
          filters.category,
          filters.urgency,
          filters.minTokens,
          previewMode, // ✅ ADD THIS - 4th parameter
        ),
        api.getQuickConnectTokens(),
        api.getQuickConnectLeaderboard(10),
        api.getMyQuickConnectRequests(previewMode), // ✅ Use previewMode
        api.getMyHelpGiven(previewMode), // ✅ Use previewMode
      ]);

      console.log("✅ Quick Connect Data Loaded:", {
        requests: boardData,
        tokens: tokensData,
        leaderboard: leaderboardData,
        myRequests: myRequestsData,
        helpGiven: helpGivenData,
      });

      // ✅ UPDATED: Handle new response format
      setRequests(boardData?.results || boardData || []);
      setTokenBalance(
        tokensData || {
          balance: 0,
          reputation_score: 0,
          help_given_count: 0,
          help_received_count: 0,
        },
      );
      setLeaderboard(leaderboardData || []);

      // ✅ UPDATED: Handle preview mode responses
      if (myRequestsData?.preview_mode) {
        setMyRequests([]);
        // Don't show modal here, let tab handle it
      } else {
        setMyRequests(myRequestsData?.requests || myRequestsData || []);
      }

      if (helpGivenData?.preview_mode) {
        setHelpGiven([]);
        // Don't show modal here, let tab handle it
      } else {
        setHelpGiven(helpGivenData?.help_given || helpGivenData || []);
      }
    } catch (error) {
      console.error("❌ Failed to fetch Quick Connect data:", error);

      // ✅ UPDATED: Handle 402 errors gracefully
      if (error.response?.status === 402) {
        toast.info("Some features require Premium. Upgrade to unlock!");
      } else {
        toast.error("Failed to load Quick Connect data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      refreshBoard();
    }
  }, [filters.category, filters.urgency, filters.minTokens]);

  const refreshBoard = async () => {
    try {
      const previewMode = isPremium === false; // ✅ Add this line

      const boardData = await api.getQuickConnectBoard(
        filters.category,
        filters.urgency,
        filters.minTokens,
        previewMode, // ✅ ADD THIS - 4th parameter
      );
      setRequests(boardData?.results || boardData || []);
    } catch (error) {
      console.error("❌ Failed to refresh board:", error);
      toast.error("Failed to refresh requests");
    }
  };

  const handleOfferHelp = async () => {
    if (!helpMessage.trim()) {
      toast.warn("Please enter a message");
      return;
    }

    if (!selectedRequest) {
      toast.error("No request selected");
      return;
    }

    try {
      const result = await api.offerQuickConnectHelp({
        request_id: selectedRequest.id,
        message: helpMessage.trim(),
      });

      toast.success(result.message || "Help offer submitted successfully!");
      setShowHelpModal(false);
      setHelpMessage("");
      setSelectedRequest(null);

      fetchAllData();
    } catch (error) {
      console.error("❌ Failed to offer help:", error);

      // ✅ UPDATED: Better error handling
      if (error.response?.status === 402) {
        setShowPremiumModal(true);
        toast.info("Premium required to offer help");
      } else if (error.response?.status === 429) {
        toast.error(
          "Daily messaging limit reached. Upgrade to Pro for unlimited messaging!",
        );
      } else {
        toast.error(error.message || "Failed to submit help offer");
      }
    }
  };

  const handleCreateRequest = async (requestData) => {
    try {
      const result = await api.createQuickConnectRequest(requestData);
      toast.success("Request posted successfully!");
      setShowCreateModal(false);

      const previewMode = !isPremium; // ✅ Add this line

      const [myRequestsData, tokensData] = await Promise.all([
        api.getMyQuickConnectRequests(previewMode), // ✅ Use previewMode
        api.getQuickConnectTokens(),
      ]);

      // ✅ UPDATED: Handle new response format
      setMyRequests(myRequestsData?.requests || myRequestsData || []);
      setTokenBalance(tokensData || tokenBalance);
      setActiveTab("my-requests");
    } catch (error) {
      console.error("❌ Failed to create request:", error);

      // ✅ UPDATED: Better error handling
      if (error.response?.status === 402) {
        setShowPremiumModal(true);
        toast.info("Premium required to create requests");
      } else {
        toast.error(error.message || "Failed to create request");
      }
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "normal":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      beta_testers: "🧪",
      guest_posts: "✍️",
      advice: "💡",
      feedback: "💬",
      collaboration: "🤝",
      promotion: "📢",
      technical: "💻",
      design: "🎨",
      marketing: "📊",
      other: "🌟",
    };
    return emojis[category] || "🌟";
  };

  // ==================== CREATE REQUEST MODAL ====================
  const CreateRequestModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      category: "advice",
      tags: [],
      token_reward: 50,
      urgency: "normal",
      target_audience: "",
    });

    const [tagInput, setTagInput] = useState("");
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (!isOpen) {
        setFormData({
          title: "",
          description: "",
          category: "advice",
          tags: [],
          token_reward: 50,
          urgency: "normal",
          target_audience: "",
        });
        setTagInput("");
        setErrors({});
      }
    }, [isOpen]);

    const categories = [
      {
        value: "beta_testers",
        label: "🧪 Beta Testers",
        desc: "Find testers for your product",
      },
      {
        value: "guest_posts",
        label: "✍️ Guest Posts",
        desc: "Get writers for your blog",
      },
      { value: "advice", label: "💡 Advice", desc: "Seek expert guidance" },
      {
        value: "feedback",
        label: "💬 Feedback",
        desc: "Get honest opinions",
      },
      {
        value: "collaboration",
        label: "🤝 Collaboration",
        desc: "Find partners",
      },
      {
        value: "promotion",
        label: "📢 Promotion",
        desc: "Boost your launch",
      },
      {
        value: "technical",
        label: "💻 Technical",
        desc: "Get technical help",
      },
      { value: "design", label: "🎨 Design", desc: "Design feedback/help" },
      {
        value: "marketing",
        label: "📊 Marketing",
        desc: "Marketing strategy",
      },
      { value: "other", label: "🌟 Other", desc: "Something else" },
    ];

    const urgencyLevels = [
      {
        value: "low",
        label: "📅 Low",
        desc: "Can wait 1-2 weeks",
        color: "bg-green-100 text-green-800",
      },
      {
        value: "normal",
        label: "⚡ Normal",
        desc: "Within a week",
        color: "bg-yellow-100 text-yellow-800",
      },
      {
        value: "high",
        label: "🔥 High",
        desc: "Urgent - ASAP",
        color: "bg-red-100 text-red-800",
      },
    ];

    const tokenRewardOptions = [
      { value: 30, label: "30 tokens", desc: "Quick task" },
      { value: 50, label: "50 tokens", desc: "Standard help" },
      { value: 75, label: "75 tokens", desc: "Detailed work" },
      { value: 100, label: "100 tokens", desc: "Comprehensive" },
      { value: 150, label: "150 tokens", desc: "Major project" },
      { value: 200, label: "200 tokens", desc: "Expert level" },
    ];

    const handleAddTag = () => {
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
        setFormData({ ...formData, tags: [...formData.tags, tag] });
        setTagInput("");
      }
    };

    const handleRemoveTag = (tagToRemove) => {
      setFormData({
        ...formData,
        tags: formData.tags.filter((tag) => tag !== tagToRemove),
      });
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    };

    const validateForm = () => {
      const newErrors = {};

      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
      } else if (formData.title.length < 10) {
        newErrors.title = "Title must be at least 10 characters";
      } else if (formData.title.length > 200) {
        newErrors.title = "Title must be less than 200 characters";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formData.description.length < 50) {
        newErrors.description = "Description must be at least 50 characters";
      } else if (formData.description.length > 1000) {
        newErrors.description = "Description must be less than 1000 characters";
      }

      if (formData.tags.length === 0) {
        newErrors.tags = "Add at least one tag";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.warn("Please fix the form errors");
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(formData);
        onClose();
      } catch (error) {
        console.error("Failed to submit request:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
        <div className="profile-modal-scroll max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white sm:px-8 sm:py-6">
            <h3 className="flex items-center gap-3 text-2xl font-bold">
              <Plus className="h-7 w-7" />
              Post New Request
            </h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-2 transition hover:bg-white/20 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
            {/* Token Cost Notice */}
            <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 shrink-0 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">
                    Posting costs 10 tokens
                  </p>
                  <p className="text-sm text-yellow-700">
                    You'll award {formData.token_reward} tokens when someone
                    helps you
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block font-bold text-gray-700">
                Request Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Need 5 Beta Testers for SaaS Platform"
                className={`w-full rounded-xl border-2 px-4 py-3 transition focus:outline-none ${
                  errors.title
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-black"
                }`}
                maxLength={200}
              />
              <div className="mt-1 flex justify-between text-sm">
                <span
                  className={errors.title ? "text-red-600" : "text-gray-500"}
                >
                  {errors.title || "Be clear and specific"}
                </span>
                <span className="text-gray-400">
                  {formData.title.length}/200
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block font-bold text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what you need help with, requirements, expectations, timeline, etc."
                className={`w-full resize-none rounded-xl border-2 px-4 py-3 transition focus:outline-none ${
                  errors.description
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-black"
                }`}
                rows="6"
                maxLength={1000}
              />
              <div className="mt-1 flex justify-between text-sm">
                <span
                  className={
                    errors.description ? "text-red-600" : "text-gray-500"
                  }
                >
                  {errors.description || "Minimum 50 characters"}
                </span>
                <span className="text-gray-400">
                  {formData.description.length}/1000
                </span>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="mb-3 block font-bold text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.value })
                    }
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      formData.category === cat.value
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="mb-1 text-lg font-bold">{cat.label}</div>
                    <div
                      className={`text-sm ${
                        formData.category === cat.value
                          ? "text-gray-200"
                          : "text-gray-600"
                      }`}
                    >
                      {cat.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block font-bold text-gray-700">
                Tags (Skills/Topics) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., react, saas, design"
                  className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 transition focus:border-black focus:outline-none"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || formData.tags.length >= 5}
                  className="rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Add
                </button>
              </div>

              {/* Tag Display */}
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-2 rounded-full border-2 border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p
                className={`mt-1 text-sm ${errors.tags ? "text-red-600" : "text-gray-500"}`}
              >
                {errors.tags ||
                  `Add ${5 - formData.tags.length} more tag${5 - formData.tags.length !== 1 ? "s" : ""} (max 5)`}
              </p>
            </div>

            {/* Token Reward */}
            <div>
              <label className="mb-3 block font-bold text-gray-700">
                Token Reward <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tokenRewardOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, token_reward: option.value })
                    }
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      formData.token_reward === option.value
                        ? "border-yellow-400 bg-yellow-50 shadow-lg"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-lg font-bold">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Higher rewards attract more helpers faster
              </p>
            </div>

            {/* Urgency */}
            <div>
              <label className="mb-3 block font-bold text-gray-700">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {urgencyLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, urgency: level.value })
                    }
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      formData.urgency === level.value
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="mb-1 text-lg font-bold">{level.label}</div>
                    <div
                      className={`text-sm ${
                        formData.urgency === level.value
                          ? "text-gray-200"
                          : "text-gray-600"
                      }`}
                    >
                      {level.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience (Optional) */}
            <div>
              <label className="mb-2 block font-bold text-gray-700">
                Target Audience{" "}
                <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData({ ...formData, target_audience: e.target.value })
                }
                placeholder="e.g., Experienced React developers, SaaS founders"
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 transition focus:border-black focus:outline-none"
                maxLength={200}
              />
              <p className="mt-1 text-sm text-gray-500">
                Who's the ideal person to help you?
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 border-t-2 border-gray-200 pt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border-2 border-gray-300 bg-white py-4 font-bold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-4 font-bold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Post Request (10 tokens)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ==================== SIDEBAR COMPONENT ====================
  const Sidebar = () => {
    const sidebarItems = [
      {
        id: "board",
        label: "Board",
        badge: requests.length,
        emoji: "🎯",
      },
      {
        id: "ai-matches",
        label: "AI Matches",
        emoji: "🤖",
        isPremium: true,
      },
      {
        id: "my-requests",
        label: "My Requests",
        badge: myRequests.length,
        emoji: "📋",
        isPremium: true,
      },
      {
        id: "help-given",
        label: "Help Given",
        badge: helpGiven.length,
        emoji: "🤝",
        isPremium: true,
      },
      {
        id: "leaderboard",
        label: "Leaderboard",
        emoji: "🏆",
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
                <span className="text-3xl">⚡</span>
                <div>
                  <h2 className="text-xl font-bold">Quick Connects</h2>
                  <p className="text-xs text-gray-300">Get help fast</p>
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
              <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                <div className="text-lg font-bold flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  {tokenBalance.balance}
                </div>
                <div className="text-xs text-gray-300">Tokens</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                <div className="text-lg font-bold">
                  {tokenBalance.reputation_score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-300">⭐ Rep</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto main-scroll p-4">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isPremium && isPreview) {
                        setShowPremiumModal(true);
                      } else {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }
                    }}
                    disabled={item.isPremium && isPreview}
                    className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl
        font-bold text-sm transition-all duration-200
        ${
          isActive
            ? "bg-black text-white shadow-lg"
            : item.isPremium && isPreview
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
      `}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.isPremium && isPreview && (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                    {item.badge > 0 && !item.isPremium && (
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
                onClick={() => {
                  if (isPreview) {
                    setShowPremiumModal(true);
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                disabled={isPreview}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
                  isPreview
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>
                  {isPreview ? "Post Request (Premium)" : "Post Request"}
                </span>
              </button>

              <button
                onClick={() => {
                  navigate("/app/home");
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 hover:from-purple-200 hover:to-purple-100 border-2 border-purple-200 hover:border-purple-400 font-bold text-sm transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Routes</span>
              </button>
            </div>
          </nav>
        </aside>
      </>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold">Loading Quick Connects...</p>
        </div>
      </div>
    );
  }

  const RequestBoardTab = () => {
    const safeRequests = Array.isArray(requests) ? requests : [];

    return (
      <div className="w-full space-y-6">
        <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
          {isPreview && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Preview Mode</p>
                    <p className="text-sm text-gray-600">
                      Upgrade to Premium to post requests and offer help
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="emoji-3d shrink-0 text-5xl">🎯</div>
              <div className="min-w-0">
                <h3 className="text-2xl font-bold">Request Board</h3>
                <p className="text-gray-600">
                  {safeRequests.length} opportunities matched to your skills
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value || null })
              }
              className="rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-black focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="beta_testers">🧪 Beta Testers</option>
              <option value="guest_posts">✍️ Guest Posts</option>
              <option value="advice">💡 Advice</option>
              <option value="feedback">💬 Feedback</option>
              <option value="collaboration">🤝 Collaboration</option>
              <option value="promotion">📢 Promotion</option>
              <option value="technical">💻 Technical</option>
              <option value="design">🎨 Design</option>
              <option value="marketing">📊 Marketing</option>
            </select>

            <select
              value={filters.urgency || ""}
              onChange={(e) =>
                setFilters({ ...filters, urgency: e.target.value || null })
              }
              className="rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-black focus:outline-none"
            >
              <option value="">All Urgency</option>
              <option value="high">🔥 High</option>
              <option value="normal">⚡ Normal</option>
              <option value="low">📅 Low</option>
            </select>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 px-6 pb-6 sm:px-8 lg:grid-cols-2 lg:px-10">
          {safeRequests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-gray-500">
                No requests available yet.
              </p>
              <p className="text-gray-400 mt-2">
                Check back soon or post your own!
              </p>
            </div>
          ) : (
            safeRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-black hover:shadow-xl"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="shrink-0 text-4xl">
                      {getCategoryEmoji(request.category)}
                    </span>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h4 className="break-words text-lg font-bold">
                          {request.title}
                        </h4>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-semibold ${getUrgencyColor(
                            request.urgency,
                          )}`}
                        >
                          {request.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Posted by{" "}
                        {request.requester?.name ||
                          request.requester?.username ||
                          "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1 text-2xl font-bold text-black">
                      <Zap className="h-6 w-6 text-yellow-500" />
                      {request.token_reward}
                    </div>
                    <div className="text-xs text-gray-500">tokens</div>
                  </div>
                </div>

                <div className="mb-4 rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-gray-700">
                      Match Score
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-black">
                        {request.match_score}%
                      </span>
                      <span className="text-2xl">
                        {request.match_score >= 80
                          ? "🎯"
                          : request.match_score >= 60
                            ? "✨"
                            : "👍"}
                      </span>
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full border border-gray-300 bg-white">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{ width: `${request.match_score}%` }}
                    />
                  </div>
                </div>

                <p className="mb-4 break-words text-gray-700">
                  {request.description}
                </p>

                {request.tags && request.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {request.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (isPreview) {
                      setShowPremiumModal(true);
                    } else {
                      setSelectedRequest(request);
                      setShowHelpModal(true);
                    }
                  }}
                  disabled={isPreview}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition ${
                    isPreview
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {isPreview ? (
                    <>
                      <Lock className="h-5 w-5" />
                      Upgrade to Offer Help
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5" />
                      Offer Help
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ✅ UPDATED: My Requests Tab with preview handling
  const MyRequestsTab = () => (
    <div className="w-full px-6 py-20 text-center sm:px-8 lg:px-10">
      {isPreview ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 border-purple-200">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              My Requests - Premium Feature
            </h3>
            <p className="text-gray-600 max-w-md">
              Upgrade to Premium to create and manage your help requests. Track
              offers, communicate with helpers, and build your reputation.
            </p>
          </div>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Upgrade to Pro to Unlock
          </button>
        </div>
      ) : myRequests.length === 0 ? (
        <>
          <div className="emoji-3d mb-4 inline-block">📋</div>
          <h3 className="mb-2 text-2xl font-bold">My Requests</h3>
          <p className="mb-6 text-gray-600">Track your posted requests</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800"
          >
            Post Your First Request
          </button>
        </>
      ) : (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-4">Your Requests</h3>
          {myRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left"
            >
              <h4 className="text-xl font-bold mb-2">{request.title}</h4>
              <p className="text-gray-600 mb-4">{request.description}</p>
              <div className="flex gap-4 text-sm">
                <span>Status: {request.status}</span>
                <span>Offers: {request.help_offers?.length || 0}</span>
                <span>Tokens: {request.token_reward}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ✅ UPDATED: Help Given Tab with preview handling
  const HelpGivenTab = () => (
    <div className="w-full px-6 py-20 text-center sm:px-8 lg:px-10">
      {isPreview ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 border-purple-200">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Help Given - Premium Feature
            </h3>
            <p className="text-gray-600 max-w-md">
              Upgrade to Premium to offer help and earn tokens. Build your
              reputation and become a top helper in the community.
            </p>
          </div>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Upgrade to Pro to Unlock
          </button>
        </div>
      ) : helpGiven.length === 0 ? (
        <>
          <div className="emoji-3d mb-4 inline-block">🤝</div>
          <h3 className="mb-2 text-2xl font-bold">Help I&apos;ve Given</h3>
          <p className="text-gray-600">
            Start helping others to build reputation
          </p>
        </>
      ) : (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold mb-4">Your Help History</h3>
          {helpGiven.map((help) => (
            <div
              key={help.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left"
            >
              <h4 className="text-xl font-bold mb-2">
                {help.request?.title || "Request"}
              </h4>
              <p className="text-gray-600 mb-4">Status: {help.status}</p>
              {help.rating && (
                <div className="flex items-center gap-2">
                  <span>Rating:</span>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < help.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const LeaderboardTab = () => (
    <div className="w-full space-y-6 px-6 py-6 sm:px-8 lg:px-10">
      <div className="rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-8 text-center">
        <div className="emoji-3d mb-4 inline-block">🏆</div>
        <h3 className="mb-2 text-3xl font-bold">Top Helpers</h3>
        <p className="text-lg text-gray-600">
          Community members with the highest reputation
        </p>
      </div>

      <div className="space-y-4">
        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No leaderboard data yet
          </p>
        ) : (
          leaderboard.map((helper, index) => (
            <div
              key={helper.user_id}
              className={`rounded-2xl border-2 bg-white p-6 transition-all ${
                index === 0
                  ? "border-yellow-400 shadow-xl"
                  : index === 1
                    ? "border-gray-400 shadow-lg"
                    : index === 2
                      ? "border-orange-400 shadow-lg"
                      : "border-gray-200 hover:border-black"
              }`}
            >
              <div className="flex items-start gap-6">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl font-bold ${
                    index === 0
                      ? "bg-yellow-400 text-yellow-900"
                      : index === 1
                        ? "bg-gray-400 text-gray-900"
                        : index === 2
                          ? "bg-orange-400 text-orange-900"
                          : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-bold">{helper.name}</h4>
                    {index < 3 && <Award className="h-5 w-5 text-yellow-500" />}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">
                        {helper.reputation_score}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{helper.help_given_count} helps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>{helper.average_rating}/5 avg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{scrollbarStyles}</style>

      <div className="h-screen w-full bg-white flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto main-scroll">
          {activeTab === "board" && <RequestBoardTab />}
          {activeTab === "ai-matches" &&
            (isPreview ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
                <div className="max-w-md text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto border-2 border-purple-200">
                    <Brain className="w-10 h-10 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      AI-Matched Opportunities
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Our AI analyzes your skills, experience, and interests to
                      find the perfect help requests for you. Get higher match
                      scores and priority access to opportunities.
                    </p>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 text-left">
                        Personalized request matching
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 text-left">
                        Higher success predictions
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 text-left">
                        Priority notifications
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="w-full bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Zap className="w-5 h-5" />
                    Upgrade to Pro to Unlock
                  </button>
                </div>
              </div>
            ) : (
              <AIMatchesTab />
            ))}
          {activeTab === "my-requests" && <MyRequestsTab />}
          {activeTab === "help-given" && <HelpGivenTab />}
          {activeTab === "leaderboard" && <LeaderboardTab />}
        </main>
      </div>

      {/* Help Modal */}
      {showHelpModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="profile-modal-scroll max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white sm:px-8 sm:py-6">
              <h3 className="flex items-center gap-3 text-2xl font-bold">
                <MessageSquare className="h-7 w-7" />
                Offer Help
              </h3>

              <button
                onClick={() => {
                  setShowHelpModal(false);
                  setSelectedRequest(null);
                  setHelpMessage("");
                }}
                className="rounded-full p-2 transition hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6">
                <div className="mb-4 flex items-start gap-4">
                  <span className="shrink-0 text-4xl">
                    {getCategoryEmoji(selectedRequest.category)}
                  </span>
                  <div className="min-w-0">
                    <h4 className="mb-2 text-xl font-bold">
                      {selectedRequest.title}
                    </h4>
                    <p className="break-words text-gray-600">
                      {selectedRequest.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-gray-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    {selectedRequest.token_reward} tokens
                  </div>
                  <span className="text-sm text-gray-500">
                    Posted by{" "}
                    {selectedRequest.requester?.name ||
                      selectedRequest.requester?.username ||
                      "Unknown"}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-3 block font-bold text-gray-700">
                  Your Offer
                </label>
                <textarea
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder="Explain how you can help, your relevant experience, and when you're available..."
                  className="w-full resize-none rounded-xl border-2 border-gray-300 px-4 py-3 transition focus:border-black focus:outline-none"
                  rows="8"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Be specific and genuine. Quality help offers get accepted
                  faster!
                </p>
              </div>

              <button
                onClick={handleOfferHelp}
                disabled={!helpMessage.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-lg font-bold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Send className="h-6 w-6" />
                Send Help Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="profile-modal-scroll max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white sm:px-8 sm:py-6">
              <h3 className="flex items-center gap-3 text-2xl font-bold">
                <HelpCircle className="h-7 w-7" />
                How Quick Connects Works
              </h3>

              <button
                onClick={() => setShowGuideModal(false)}
                className="rounded-full p-2 transition hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <p className="text-center text-lg font-semibold text-gray-700">
                A token-based system for getting help fast and building
                reputation.
              </p>

              <div className="space-y-4">
                {[
                  {
                    emoji: "💰",
                    title: "Earn Tokens",
                    desc: "Start with 100 tokens. Earn more by helping others.",
                  },
                  {
                    emoji: "📝",
                    title: "Post Requests",
                    desc: "Need beta testers, advice, or collaboration? Post with token rewards (costs 10 tokens to post).",
                  },
                  {
                    emoji: "🤝",
                    title: "Offer Help",
                    desc: "Browse requests matched to your skills. Offer help and earn the token reward when completed.",
                  },
                  {
                    emoji: "⭐",
                    title: "Build Reputation",
                    desc: "Get rated 1-5 stars. High reputation = more requests match to you.",
                  },
                  {
                    emoji: "🏆",
                    title: "Climb Leaderboard",
                    desc: "Top helpers get featured and attract more opportunities.",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 transition hover:border-black"
                  >
                    <div className="shrink-0 text-5xl">{step.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 text-lg font-bold">{step.title}</h4>
                      <p className="text-gray-700">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full rounded-xl bg-black py-4 text-lg font-bold text-white shadow-lg transition hover:bg-gray-800"
              >
                Got it! Let&apos;s connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        defaultTab="premium"
      />
    </>
  );
};

export default QuickConnects;
