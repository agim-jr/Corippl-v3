// frontend/src/components/CreatorCollectives.jsx

import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useApi } from "../lib/api";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  ArrowRight,
  Plus,
  ChevronLeft,
  X,
  Menu,
  Search,
  Filter,
  Share2,
  MessageSquare,
  Activity,
  Target,
  Sparkles,
  Brain,
  Upload,
  Link as LinkIcon,
  Lock,
  Check,
  Zap,
} from "lucide-react";
import CollectivesIntelligence from "./CollectivesIntelligence";
import PremiumModal from "../components/PremiumModal";

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

const CreatorCollectives = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user, isPremium } = useContext(AuthContext);
  const api = useApi();

  // ✅ CRITICAL FIX: Derive isPreview from isPremium context
  const isPreview = !isPremium;

  const [activeTab, setActiveTab] = useState("overview");
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadContentModal, setShowUploadContentModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Data
  const [dashboardData, setDashboardData] = useState(null);
  const [browseGroups, setBrowseGroups] = useState([]);
  const [filters, setFilters] = useState({
    niche: "",
    status: "forming",
  });

  const [createGroupForm, setCreateGroupForm] = useState({
    name: "",
    description: "",
    niche: "",
    max_members: 8,
    follower_range_min: 0,
    follower_range_max: 10000,
    shares_per_week: 5,
  });
  const [createGroupLoading, setCreateGroupLoading] = useState(false);

  const niches = [
    "Technology",
    "Marketing",
    "Health & Fitness",
    "Finance",
    "Education",
    "Entertainment",
    "Food & Cooking",
    "Travel",
    "Fashion",
    "Gaming",
  ];

  // Share Content Modal Component
  const ShareContentModal = ({ schedule, onClose, onSubmit }) => {
    const [selectedContent, setSelectedContent] = useState(null);
    const [userContent, setUserContent] = useState([]);
    const [shareUrl, setShareUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [contentLoading, setContentLoading] = useState(true);

    useEffect(() => {
      const fetchContent = async () => {
        try {
          setContentLoading(true);
          const response = await api.apiFetch("/content/my-content", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          const data = await response.json();
          setUserContent(data || []);
        } catch (error) {
          console.error("Failed to fetch content:", error);
          setUserContent([]);
        } finally {
          setContentLoading(false);
        }
      };
      fetchContent();
    }, []);

    const handleSubmit = async () => {
      if (!selectedContent || !shareUrl.trim()) {
        alert("Please select content and enter the share URL");
        return;
      }

      setLoading(true);
      try {
        await onSubmit({
          content_id: selectedContent,
          share_url: shareUrl,
          schedule_id: schedule.id,
        });
      } catch (error) {
        console.error("Failed to record share:", error);
        alert(error.message || "Failed to record share");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="profile-modal-scroll max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white">
            <h3 className="flex items-center gap-3 text-2xl font-bold">
              <Share2 className="h-7 w-7" />
              Share Content
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-900">
                📅 Share for: {schedule?.profile_name || schedule?.username}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Record that you shared this creator's content today
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Select Your Content to Share{" "}
                <span className="text-red-500">*</span>
              </label>
              {contentLoading ? (
                <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-center text-gray-600">
                  Loading your content...
                </div>
              ) : userContent.length === 0 ? (
                <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4">
                  <p className="text-sm font-bold text-yellow-900 mb-2">
                    No content found
                  </p>
                  <p className="text-xs text-yellow-700 mb-3">
                    You need to upload content before you can share it
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      setShowUploadContentModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-yellow-900 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-800 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Content Now
                  </button>
                </div>
              ) : (
                <select
                  value={selectedContent || ""}
                  onChange={(e) => setSelectedContent(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                >
                  <option value="">Choose content...</option>
                  {userContent.map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.title}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Select which of your content pieces you're sharing
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Where Did You Share It? <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://twitter.com/yourpost or https://instagram.com/p/..."
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to your social media post where you shared this content
              </p>
            </div>

            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-600">
                <strong>How it works:</strong> Share the content from{" "}
                <strong>{schedule?.profile_name || schedule?.username}</strong>{" "}
                on your social media, then paste the link to your post here to
                verify the share.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700 hover:border-black hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedContent || !shareUrl.trim()}
                className="flex-1 rounded-xl bg-black py-3 font-bold text-white hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Recording..." : "Record Share ✅"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Content Modal Component
  const UploadContentModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
      title: "",
      url: "",
      description: "",
    });
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async () => {
      if (!formData.title.trim() || !formData.url.trim()) {
        alert("Title and URL are required");
        return;
      }

      setUploading(true);
      try {
        const response = await api.apiFetch("/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          alert("Content uploaded successfully! ✅");
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const error = await response.json();
          alert(error.detail || "Failed to upload content");
        }
      } catch (error) {
        console.error("Failed to upload content:", error);
        alert("Failed to upload content");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="profile-modal-scroll max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white">
            <h3 className="flex items-center gap-3 text-2xl font-bold">
              <Upload className="h-7 w-7" />
              Upload Content
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Content Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. My Latest Blog Post"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Content URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/my-content"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to your blog post, video, podcast, etc.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of your content..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full resize-none rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700 hover:border-black hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  uploading || !formData.title.trim() || !formData.url.trim()
                }
                className="flex-1 rounded-xl bg-black py-3 font-bold text-white hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {uploading ? "Uploading..." : "Upload Content 🚀"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCreateGroup = async () => {
    if (!createGroupForm.name.trim() || !createGroupForm.niche) {
      alert("Name and niche are required.");
      return;
    }
    try {
      setCreateGroupLoading(true);
      const response = await api.apiFetch("/collectives/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createGroupForm),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateGroupForm({
          name: "",
          description: "",
          niche: "",
          max_members: 8,
          follower_range_min: 0,
          follower_range_max: 10000,
          shares_per_week: 5,
        });
        fetchDashboard();
        setActiveTab("my-groups");
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group");
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const handleRecordShare = async (shareData) => {
    try {
      const response = await api.apiFetch("/collectives/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: selectedSchedule.group_id,
          recipient_user_id: selectedSchedule.user_id,
          content_id: shareData.content_id,
          share_url: shareData.share_url,
        }),
      });

      if (response.ok) {
        alert("Share recorded successfully! 🎉");
        setShowShareModal(false);
        setSelectedSchedule(null);
        fetchDashboard();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Failed to record share");
      }
    } catch (error) {
      console.error("Failed to record share:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetail(groupId);
      setActiveTab("group-detail");
      setShowWelcome(false);
    } else {
      fetchDashboard();
    }
  }, [groupId]);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchBrowseGroups();
    }
  }, [activeTab, filters]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.apiFetch("/collectives/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setDashboardData(data);

      if (data.my_groups && data.my_groups.length > 0) {
        setShowWelcome(false);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrowseGroups = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.niche) params.append("niche", filters.niche);
      if (filters.status) params.append("status", filters.status);

      const response = await api.apiFetch(
        `/collectives/groups?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      setBrowseGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchGroupDetail = async (id) => {
    try {
      const response = await api.apiFetch(`/collectives/groups/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setSelectedGroup(data);
    } catch (error) {
      console.error("Failed to fetch group detail:", error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await api.apiFetch(
        `/collectives/groups/${groupId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        alert("Successfully joined the collective! 🎉");
        fetchDashboard();
        setActiveTab("overview");
      }
    } catch (error) {
      console.error("Failed to join group:", error);
      alert(error.message || "Failed to join group");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "probation":
        return "bg-red-100 text-red-800 border-red-300";
      case "forming":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case "active":
        return "✅";
      case "warning":
        return "⚠️";
      case "probation":
        return "🚨";
      case "forming":
        return "🔨";
      default:
        return "📊";
    }
  };

  // Sidebar Component
  const Sidebar = () => {
    const sidebarItems = [
      {
        id: "overview",
        label: "Overview",
        emoji: "🏠",
        badge: dashboardData?.my_groups?.length || 0,
      },
      {
        id: "my-groups",
        label: "My Groups",
        emoji: "👥",
        badge: dashboardData?.my_groups?.length || 0,
      },
      {
        id: "schedule",
        label: "Schedule",
        emoji: "📅",
        badge: dashboardData?.upcoming_shares?.length || 0,
      },
      {
        id: "browse",
        label: "Browse",
        emoji: "🔍",
      },
      {
        id: "activity",
        label: "Activity",
        emoji: "📊",
      },
      {
        id: "intelligence",
        label: "Intelligence",
        emoji: "🧠",
        badge: dashboardData?.my_groups?.length || 0,
        isPremium: true, // Add this line
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
                <span className="text-3xl">🤝</span>
                <div>
                  <h2 className="text-xl font-bold">Collectives</h2>
                  <p className="text-xs text-gray-300">Team up & grow</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dashboardData?.overall_stats && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">
                    {dashboardData.overall_stats.total_shares_completed}
                  </div>
                  <div className="text-xs text-gray-300">✅ Shares</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">
                    {dashboardData.overall_stats.average_reliability}%
                  </div>
                  <div className="text-xs text-gray-300">⭐ Score</div>
                </div>
              </div>
            )}
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
                        if (groupId) navigate("/app/collectives");
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
                <Sparkles className="w-5 h-5" />
                <span>How It Works</span>
              </button>

              <button
                onClick={() =>
                  isPreview
                    ? alert("Upgrade to Premium to create collectives")
                    : setShowCreateModal(true)
                }
                disabled={isPreview}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
                  isPreview
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>
                  {isPreview ? "Create Group (Premium)" : "Create Group"}
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

  // Welcome Screen
  const WelcomeScreen = () => (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full px-6 py-12 text-center sm:px-8 lg:px-10 overflow-auto main-scroll">
        <div className="emoji-3d mx-auto mb-6 text-6xl">🤝</div>

        <div className="mb-10">
          <h2 className="mb-3 text-4xl font-bold sm:text-5xl">
            Welcome to Creator Collectives!
          </h2>
          <p className="text-lg text-gray-600">
            Join small, matched groups for structured reciprocal support.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
            <div className="mb-4 text-5xl">👥</div>
            <h3 className="mb-2 text-xl font-bold">Small Matched Groups</h3>
            <p className="text-gray-600">
              Join 4-8 creators in your niche with similar audience sizes. AI
              matches you with ideal partners.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
            <div className="mb-4 text-5xl">📅</div>
            <h3 className="mb-2 text-xl font-bold">Rotating Schedule</h3>
            <p className="text-gray-600">
              Each member gets dedicated days when everyone shares their
              content. Fair, structured, and automated.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
            <div className="mb-4 text-5xl">✅</div>
            <h3 className="mb-2 text-xl font-bold">Automated Verification</h3>
            <p className="text-gray-600">
              Tracking links prove shares happened. Three-strike system keeps
              everyone accountable.
            </p>
          </div>
        </div>

        <div className="mt-12 space-x-4">
          <button
            onClick={() => {
              setActiveTab("browse");
              setShowWelcome(false);
            }}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-black px-10 py-5 text-xl font-bold text-white shadow-xl transition hover:bg-gray-800"
          >
            <Users className="h-7 w-7" />
            Browse Groups
          </button>

          <button
            onClick={() => setShowWelcome(false)}
            className="inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-black bg-white px-10 py-5 text-xl font-bold text-black shadow-xl transition hover:bg-gray-100"
          >
            View Dashboard
            <ArrowRight className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );

  // Overview Tab
  const OverviewTab = () => (
    <div className="w-full space-y-6">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        {/* ✅ BANNER MOVED TO TOP */}
        {isPreview && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Preview Mode</p>
                  <p className="text-sm text-gray-600">
                    Upgrade to Premium to join collectives and unlock full
                    features
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <div className="emoji-3d text-5xl">🏠</div>
          <div>
            <h3 className="text-3xl font-bold">Your Dashboard</h3>
            <p className="text-gray-600">Track your collective activity</p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {dashboardData?.overall_stats?.total_groups || 0}
            </div>
            <div className="text-sm text-gray-600">Active Groups</div>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-green-50 to-white p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {dashboardData?.overall_stats?.total_shares_completed || 0}
            </div>
            <div className="text-sm text-gray-600">Shares Completed</div>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-yellow-50 to-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {dashboardData?.overall_stats?.upcoming_shares_count || 0}
            </div>
            <div className="text-sm text-gray-600">Upcoming Shares</div>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-purple-50 to-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {dashboardData?.overall_stats?.average_reliability || 0}%
            </div>
            <div className="text-sm text-gray-600">Reliability Score</div>
          </div>
        </div>
      </div>

      {dashboardData?.my_groups && dashboardData.my_groups.length > 0 ? (
        <div className="px-6 pb-6 sm:px-8 lg:px-10 space-y-4">
          <h4 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">👥</span>
            My Collectives
          </h4>

          {dashboardData.my_groups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-black hover:shadow-xl transition cursor-pointer"
              onClick={() => navigate(`/app/collectives/${group.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold">{group.name}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                        group.status,
                      )}`}
                    >
                      {getStatusEmoji(group.status)} {group.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{group.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.current_member_count}/{group.max_members} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {group.shares_per_week}x/week
                    </div>
                    <div className="px-2 py-1 bg-gray-100 rounded-full">
                      #{group.niche}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-gray-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 pb-6 sm:px-8 lg:px-10 text-center py-12">
          <div className="emoji-3d text-6xl mb-4">🤝</div>
          <h4 className="text-xl font-bold mb-2">No Groups Yet</h4>
          <p className="text-gray-600 mb-6">
            Join or create a collective to start growing together!
          </p>
          <button
            onClick={() => setActiveTab("browse")}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 transition"
          >
            <Search className="w-5 h-5" />
            Browse Groups
          </button>
        </div>
      )}
    </div>
  );

  // My Groups Tab
  const MyGroupsTab = () => (
    <div className="w-full space-y-6">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="emoji-3d text-5xl">👥</div>
            <div>
              <h3 className="text-3xl font-bold">My Collectives</h3>
              <p className="text-gray-600">
                {dashboardData?.my_groups?.length || 0} active groups
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("browse")}
            className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 transition"
          >
            <Plus className="w-5 h-5" />
            Join New Group
          </button>
        </div>
      </div>

      {dashboardData?.my_groups && dashboardData.my_groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 px-6 pb-6 sm:px-8 lg:grid-cols-2 lg:px-10">
          {dashboardData.my_groups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-black hover:shadow-xl transition cursor-pointer"
              onClick={() => navigate(`/app/collectives/${group.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xl font-bold">{group.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                        group.status,
                      )}`}
                    >
                      {getStatusEmoji(group.status)} {group.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{group.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Members</span>
                  <span className="font-bold">
                    {group.current_member_count}/{group.max_members}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{
                      width: `${
                        (group.current_member_count / group.max_members) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {group.shares_per_week}x/week
                  </div>
                  <div className="px-2 py-1 bg-gray-100 rounded-full">
                    #{group.niche}
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-6">
          <div className="emoji-3d text-6xl mb-4">🤝</div>
          <h4 className="text-xl font-bold mb-2">No Groups Yet</h4>
          <p className="text-gray-600 mb-6">
            Join or create a collective to start growing together!
          </p>
          <button
            onClick={() => setActiveTab("browse")}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 transition"
          >
            <Plus className="w-5 h-5" />
            Browse Groups
          </button>
        </div>
      )}
    </div>
  );

  // Schedule Tab
  const ScheduleTab = () => (
    <div className="w-full space-y-6">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="emoji-3d text-5xl">📅</div>
            <div>
              <h3 className="text-3xl font-bold">My Schedule</h3>
              <p className="text-gray-600">Next 7 days of collective shares</p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadContentModal(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 transition"
          >
            <Upload className="w-5 h-5" />
            Upload Content
          </button>
        </div>
      </div>

      {dashboardData?.upcoming_shares &&
      dashboardData.upcoming_shares.length > 0 ? (
        <div className="space-y-4 px-6 pb-6 sm:px-8 lg:px-10">
          {dashboardData.upcoming_shares.map((share) => {
            const shareDate = new Date(share.share_date);
            const isToday =
              shareDate.toDateString() === new Date().toDateString();
            const isPast = shareDate < new Date();

            return (
              <div
                key={share.id}
                className={`rounded-2xl border-2 p-6 transition ${
                  isToday
                    ? "border-black bg-black text-white"
                    : isPast
                      ? "border-gray-200 bg-gray-100 opacity-50"
                      : "border-gray-200 bg-white hover:border-black"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center font-bold ${
                      isToday ? "bg-white text-black" : "bg-gray-900 text-white"
                    }`}
                  >
                    <div className="text-xs">
                      {shareDate
                        .toLocaleDateString("en-US", { weekday: "short" })
                        .toUpperCase()}
                    </div>
                    <div className="text-3xl">{shareDate.getDate()}</div>
                    <div className="text-xs">
                      {shareDate.toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-bold">
                        {share.profile_name || share.username}
                      </h4>
                      {share.is_completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    <p className={isToday ? "text-white/80" : "text-gray-600"}>
                      {isToday
                        ? "⚡ Share this creator's content today!"
                        : `Share this creator's content on ${share.day_of_week}`}
                    </p>

                    {isToday && !share.is_completed && (
                      <button
                        onClick={() => {
                          if (isPreview) {
                            alert("Upgrade to Premium to record shares");
                          } else {
                            setSelectedSchedule(share);
                            setShowShareModal(true);
                          }
                        }}
                        disabled={isPreview}
                        className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition ${
                          isPreview
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-white text-black hover:bg-gray-100"
                        }`}
                      >
                        {isPreview ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Share2 className="w-5 h-5" />
                        )}
                        {isPreview ? "Locked" : "Record Share"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-6">
          <div className="emoji-3d text-6xl mb-4">📅</div>
          <h4 className="text-xl font-bold mb-2">No Upcoming Shares</h4>
          <p className="text-gray-600">
            Join a collective to see your share schedule!
          </p>
        </div>
      )}
    </div>
  );

  // Browse Tab
  const BrowseTab = () => (
    <div className="w-full space-y-6">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="emoji-3d text-5xl">🔍</div>
            <div>
              <h3 className="text-3xl font-bold">Browse Collectives</h3>
              <p className="text-gray-600">Find your perfect creator group</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.niche}
            onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
            className="rounded-lg border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
          >
            <option value="">All Niches</option>
            {niches.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-lg border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="forming">🔨 Forming</option>
            <option value="active">✅ Active</option>
          </select>

          <button
            onClick={() =>
              isPreview ? setShowPremiumModal(true) : setShowCreateModal(true)
            }
            disabled={isPreview}
            className={`ml-auto rounded-lg px-6 py-3 font-bold transition ${
              isPreview
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {isPreview && <Lock className="w-5 h-5 mr-2 inline" />}+ Create New
            Group {isPreview && "(Premium)"}
          </button>
        </div>
      </div>

      {browseGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 px-6 pb-6 sm:px-8 lg:grid-cols-2 lg:px-10">
          {browseGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-black hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold">{group.name}</h3>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold">
                      #{group.niche}
                    </span>
                  </div>
                  <p className="text-gray-600">{group.description}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Members</span>
                  <span className="font-bold">
                    {group.current_member_count}/{group.max_members}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{
                      width: `${
                        (group.current_member_count / group.max_members) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {group.shares_per_week}x/week
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {group.follower_range_min?.toLocaleString()}-
                    {group.follower_range_max?.toLocaleString()} followers
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    fetchGroupDetail(group.id);
                    setShowGroupDetailModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-bold text-gray-700 hover:border-black transition"
                >
                  View Details
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() =>
                    isPreview
                      ? alert("Upgrade to Premium to join collectives")
                      : handleJoinGroup(group.id)
                  }
                  disabled={
                    isPreview || group.current_member_count >= group.max_members
                  }
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-bold text-white hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isPreview ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {isPreview ? "Locked (Premium)" : "Join Group"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-6">
          <div className="emoji-3d text-6xl mb-4">🤝</div>
          <h3 className="text-2xl font-bold mb-2">No Groups Found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or create a new group!
          </p>
          <button
            onClick={() =>
              isPreview
                ? alert("Upgrade to Premium to create collectives")
                : setShowCreateModal(true)
            }
            disabled={isPreview}
            className={`ml-auto rounded-lg px-6 py-3 font-bold transition ${
              isPreview
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            + Create New Group {isPreview && "(Premium)"}
          </button>
        </div>
      )}
    </div>
  );

  // Activity Tab
  const ActivityTab = () => (
    <div className="w-full space-y-6">
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="emoji-3d text-5xl">📊</div>
          <div>
            <h3 className="text-3xl font-bold">Recent Activity</h3>
            <p className="text-gray-600">Your collective interactions</p>
          </div>
        </div>
      </div>

      {dashboardData?.recent_activity &&
      dashboardData.recent_activity.length > 0 ? (
        <div className="space-y-3 px-6 pb-6 sm:px-8 lg:px-10">
          {dashboardData.recent_activity.map((activity, index) => (
            <div
              key={activity.id || index}
              className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-black transition"
            >
              <div className="shrink-0 w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl">
                {activity.action === "share_completed"
                  ? "✅"
                  : activity.action === "share_missed"
                    ? "⚠️"
                    : activity.action === "member_joined"
                      ? "👋"
                      : "📊"}
              </div>

              <div className="flex-1">
                <div className="font-bold">{activity.description}</div>
                <div className="text-sm text-gray-600">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-6">
          <div className="emoji-3d text-6xl mb-4">📊</div>
          <h4 className="text-xl font-bold mb-2">No Activity Yet</h4>
          <p className="text-gray-600">
            Your collective activity will appear here
          </p>
        </div>
      )}
    </div>
  );

  // Group Detail Tab (when viewing specific group)
  const GroupDetailTab = () => {
    if (!selectedGroup) return null;

    return (
      <div className="w-full space-y-6">
        <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
          <button
            onClick={() => {
              navigate("/app/collectives");
              setActiveTab("my-groups");
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to My Groups
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-bold">
                  {selectedGroup.group.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                    selectedGroup.group.status,
                  )}`}
                >
                  {getStatusEmoji(selectedGroup.group.status)}{" "}
                  {selectedGroup.group.status}
                </span>
              </div>
              <p className="text-gray-600 text-lg">
                {selectedGroup.group.description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-8 lg:px-10 space-y-6">
          {/* Group Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
              <div className="text-2xl font-bold">
                {selectedGroup.group.current_member_count}/
                {selectedGroup.group.max_members}
              </div>
              <div className="text-sm text-gray-600">👥 Members</div>
            </div>

            <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
              <div className="text-2xl font-bold">
                {selectedGroup.group.shares_per_week}x
              </div>
              <div className="text-sm text-gray-600">📅 Shares per Week</div>
            </div>

            <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
              <div className="text-2xl font-bold">
                {selectedGroup.group_stats?.average_quality_score?.toFixed(1) ||
                  0}
              </div>
              <div className="text-sm text-gray-600">⭐ Quality Score</div>
            </div>
          </div>

          {/* Members List */}
          {selectedGroup.members && selectedGroup.members.length > 0 && (
            <div className="rounded-2xl border-2 border-gray-300 bg-white p-6">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Members ({selectedGroup.members.length})
              </h4>

              <div className="space-y-3">
                {selectedGroup.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-gray-50"
                  >
                    <div>
                      <div className="font-bold">
                        {member.profile_name || member.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        Reliability: {member.reliability_score}% • Shares:{" "}
                        {member.shares_completed}
                      </div>
                    </div>
                    {member.is_admin && (
                      <span className="px-2 py-1 bg-black text-white text-xs font-bold rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Schedule */}
          {selectedGroup.schedule && selectedGroup.schedule.length > 0 && (
            <div className="rounded-2xl border-2 border-gray-300 bg-white p-6">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Upcoming Schedule
              </h4>

              <div className="space-y-3">
                {selectedGroup.schedule.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-gray-50"
                  >
                    <div className="shrink-0 w-16 h-16 rounded-xl bg-black text-white flex flex-col items-center justify-center font-bold">
                      <div className="text-xs">
                        {new Date(schedule.share_date)
                          .toLocaleDateString("en-US", { weekday: "short" })
                          .toUpperCase()}
                      </div>
                      <div className="text-2xl">
                        {new Date(schedule.share_date).getDate()}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="font-bold">
                        {schedule.profile_name || schedule.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        {schedule.day_of_week} · Everyone shares their content
                      </div>
                    </div>

                    {schedule.is_completed && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="emoji-3d text-6xl mb-4">🤝</div>
          <div className="text-xl font-bold">Loading your collectives...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>

      <div className="h-screen w-full bg-white flex overflow-hidden">
        {showWelcome ? (
          <WelcomeScreen />
        ) : (
          <>
            <Sidebar />

            <main className="flex-1 overflow-y-auto main-scroll">
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "my-groups" && <MyGroupsTab />}
              {activeTab === "schedule" && <ScheduleTab />}
              {activeTab === "browse" && <BrowseTab />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "group-detail" && <GroupDetailTab />}
              {activeTab === "intelligence" && (
                <div className="w-full h-full">
                  {isPreview ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
                      <div className="max-w-md text-center space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto border-2 border-purple-200">
                          <Brain className="w-10 h-10 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            AI Intelligence Insights
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            Get AI-powered analytics and predictions about your
                            collectives. Track success patterns, member
                            engagement, and receive personalized recommendations
                            to optimize your collaborations.
                          </p>
                        </div>
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 text-left">
                              AI success predictions for your groups
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 text-left">
                              Member compatibility analysis
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 text-left">
                              Personalized growth recommendations
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 text-left">
                              Engagement trends & insights
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
                    <CollectivesIntelligence />
                  )}
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* Share Content Modal */}
      {showShareModal && selectedSchedule && (
        <ShareContentModal
          schedule={selectedSchedule}
          onClose={() => {
            setShowShareModal(false);
            setSelectedSchedule(null);
          }}
          onSubmit={handleRecordShare}
        />
      )}

      {/* Upload Content Modal */}
      {showUploadContentModal && (
        <UploadContentModal
          onClose={() => setShowUploadContentModal(false)}
          onSuccess={() => {
            // Optionally refresh content list or dashboard
            fetchDashboard();
          }}
        />
      )}

      {/* How It Works Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="profile-modal-scroll max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white sm:px-8 sm:py-6">
              <h3 className="flex items-center gap-3 text-2xl font-bold">
                <Sparkles className="h-7 w-7" />
                How Collectives Work
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
                Small, matched groups for structured reciprocal support.
              </p>

              <div className="space-y-4">
                {[
                  {
                    emoji: "🎯",
                    title: "AI Matching",
                    desc: "Get matched with 4-8 creators in your niche with similar audience sizes. Perfect fits only.",
                  },
                  {
                    emoji: "📅",
                    title: "Rotating Schedule",
                    desc: "Each member gets dedicated days when everyone shares their content. Fair and structured.",
                  },
                  {
                    emoji: "🔗",
                    title: "Tracking Links",
                    desc: "Use custom tracking links to prove shares happened. No manual verification needed.",
                  },
                  {
                    emoji: "⚠️",
                    title: "Three-Strike System",
                    desc: "Miss 3 shares? Get a warning. Miss 3 more? Moved to probation. Keeps everyone accountable.",
                  },
                  {
                    emoji: "🏆",
                    title: "Build Reputation",
                    desc: "Consistent sharing builds your reliability score. Higher scores = better group matches.",
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
                Got it! Let&apos;s start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="profile-modal-scroll max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white sm:px-8">
              <h3 className="flex items-center gap-3 text-2xl font-bold">
                <Plus className="h-7 w-7" />
                Create Collective
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 transition hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Tech Creators Collective"
                  value={createGroupForm.name}
                  onChange={(e) =>
                    setCreateGroupForm({
                      ...createGroupForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is this group about?"
                  value={createGroupForm.description}
                  onChange={(e) =>
                    setCreateGroupForm({
                      ...createGroupForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Niche <span className="text-red-500">*</span>
                </label>
                <select
                  value={createGroupForm.niche}
                  onChange={(e) =>
                    setCreateGroupForm({
                      ...createGroupForm,
                      niche: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                >
                  <option value="">Select a niche…</option>
                  {niches.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Max Members
                </label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={createGroupForm.max_members}
                  onChange={(e) =>
                    setCreateGroupForm({
                      ...createGroupForm,
                      max_members: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Between 4–12</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Follower Range
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={createGroupForm.follower_range_min}
                    onChange={(e) =>
                      setCreateGroupForm({
                        ...createGroupForm,
                        follower_range_min: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                  />
                  <span className="shrink-0 font-bold text-gray-500">–</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={createGroupForm.follower_range_max}
                    onChange={(e) =>
                      setCreateGroupForm({
                        ...createGroupForm,
                        follower_range_max: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Target follower count range for members
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Shares Per Week
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={createGroupForm.shares_per_week}
                  onChange={(e) =>
                    setCreateGroupForm({
                      ...createGroupForm,
                      shares_per_week: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-bold focus:border-black focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Between 1–7 days</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700 transition hover:border-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={createGroupLoading}
                  className="flex-1 rounded-xl bg-black py-3 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {createGroupLoading ? "Creating…" : "Create Collective 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Detail Modal (from Browse) */}
      {showGroupDetailModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="profile-modal-scroll max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-black px-6 py-5 text-white sm:px-8 sm:py-6">
              <h3 className="flex items-center gap-3 text-2xl font-bold">
                <Users className="h-7 w-7" />
                {selectedGroup.group?.name || "Group Details"}
              </h3>

              <button
                onClick={() => {
                  setShowGroupDetailModal(false);
                  setSelectedGroup(null);
                }}
                className="rounded-full p-2 transition hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6">
                <p className="text-gray-700 mb-4">
                  {selectedGroup.group?.description ||
                    "No description available"}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Members</div>
                    <div className="font-bold">
                      {selectedGroup.group?.current_member_count || 0}/
                      {selectedGroup.group?.max_members || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Shares/Week</div>
                    <div className="font-bold">
                      {selectedGroup.group?.shares_per_week || 0}x
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Niche</div>
                    <div className="font-bold">
                      #{selectedGroup.group?.niche || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Follower Range</div>
                    <div className="font-bold">
                      {selectedGroup.group?.follower_range_min?.toLocaleString() ||
                        0}
                      -
                      {selectedGroup.group?.follower_range_max?.toLocaleString() ||
                        0}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  handleJoinGroup(selectedGroup.group?.id);
                  setShowGroupDetailModal(false);
                }}
                disabled={
                  (selectedGroup.group?.current_member_count || 0) >=
                  (selectedGroup.group?.max_members || 0)
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-4 text-lg font-bold text-white shadow-lg transition hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-6 w-6" />
                Join This Collective
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        defaultTab="premium"
      />
    </>
  );
};

export default CreatorCollectives;
