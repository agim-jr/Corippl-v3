// frontend/src/components/GuidedWorkflow.jsx

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Zap,
  Plus,
  Film,
  LayoutGrid,
  X,
  Menu,
  HelpCircle,
  Home,
} from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import List1 from "./List1";
import Reel from "./Reel";
import List2 from "./List2";
import ShareAndManage from "./ShareAndManage";
import { toast } from "react-hot-toast";
import { useApi } from "../lib/api";

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

const GuidedWorkflow = ({
  contents = [],
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
  matches = [],
  selectedMatches = [],
  setSelectedMatches,
  loading,
  sharedContents = [],
  onUnshare,
  onShare,
  userContents = [],
  onContentUpdated,
  onContentDeleted,
  selectedContents = [],
  setSelectedContents,
  onOpenManageModal,
  user,
  setIsAIModalOpen,
  onOpenPremiumModal,
  onOpenContactsModal,
  onProfileClick,
  onNotificationsClick,
  onContactsClick,
  onAddContentClick,
  onProgressClick,
  onPremiumClick,
  onHelpClick,
  viewMode,
  setViewMode,
  ...otherProps
}) => {
  const navigate = useNavigate();
  const { user: contextUser } = useContext(AuthContext);
  const effectiveUser = user || contextUser;
  const [currentStep, setCurrentStep] = useState(1);
  const [shuffledMatches, setShuffledMatches] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleData, setShuffleData] = useState(null);
  const [reelViewMode, setReelViewMode] = useState("reel");

  const [queueStatus, setQueueStatus] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { shuffleMatches, getRemainingShuffles, getQueueAutomationStatus } =
    useApi();
  const { isPremium } = useContext(AuthContext);

  useEffect(() => {
    fetchShuffles();
  }, []);

  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const data = await getQueueAutomationStatus();
        setQueueStatus(data);
      } catch (error) {
        console.error("Failed to fetch queue status:", error);
      }
    };

    if (userContents.length > 0) {
      fetchQueueStatus();
    }
  }, [userContents, getQueueAutomationStatus]);

  const fetchShuffles = async () => {
    try {
      const data = await getRemainingShuffles();
      setShuffleData(data);
    } catch (err) {
      console.error("Failed to fetch remaining shuffles:", err);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedMatches.length === 0) {
        toast.error("Please select at least one item to share");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast.success("🎉 Great job! Starting a new cycle...");
    setCurrentStep(1);
    setSelectedMatches([]);
  };

  const handleShuffle = async () => {
    const totalShuffles = shuffleData?.total_shuffles || 0;

    if (!isPremium && totalShuffles <= 0) {
      toast.error(
        "No shuffles remaining. Upgrade to Premium for unlimited shuffles!",
      );
      if (onOpenPremiumModal) {
        onOpenPremiumModal();
      }
      return;
    }

    setIsShuffling(true);
    try {
      const newMatches = await shuffleMatches();
      setShuffledMatches(newMatches);
      await fetchShuffles();
      toast.success("Matches shuffled successfully!");
    } catch (err) {
      console.error("Shuffle failed:", err);
      toast.error(err.message || "Failed to shuffle matches.");
    } finally {
      setIsShuffling(false);
    }
  };

  const handleAutopilotStatusChange = (newStatus) => {
    setAutopilotStatus(newStatus);
  };

  const handleNavigationClick = (itemName) => {
    setIsSidebarOpen(false);
    switch (itemName) {
      case "Profile":
        onProfileClick?.();
        break;
      case "Contacts":
        onContactsClick?.();
        break;
      case "Add content":
        onAddContentClick?.();
        break;
      case "Notifications":
        onNotificationsClick?.();
        break;
      case "Progress":
        onProgressClick?.();
        break;
      case "Premium":
        onPremiumClick?.();
        break;
      default:
        break;
    }
  };

  // Sidebar Component
  const Sidebar = () => {
    const sidebarItems = [
      {
        name: "Profile",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        ),
      },
      {
        name: "Contacts",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
            />
          </svg>
        ),
      },
      {
        name: "Add content",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        ),
      },
      {
        name: "Notifications",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        ),
      },
      {
        name: "Progress",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        ),
      },
      {
        name: "Premium",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        ),
      },
    ];

    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-black text-white p-3 rounded-xl shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
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
          {/* Header */}
          <div className="p-6 border-b-4 border-gray-900 bg-black text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <h2 className="text-xl font-bold">Cross-Promotion</h2>
                  <p className="text-xs text-gray-300">Grow together</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                <div className="text-lg font-bold">
                  {(userContents || contents || []).length}
                </div>
                <div className="text-xs text-gray-300">Queue</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                <div className="text-lg font-bold">
                  {selectedMatches.length}
                </div>
                <div className="text-xs text-gray-300">Selected</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto main-scroll p-4">
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigationClick(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm transition-all duration-200"
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-2">
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
        <div className="emoji-3d mx-auto mb-6 text-6xl">🎯</div>

        <div className="mb-10">
          <h2 className="mb-3 text-4xl font-bold sm:text-5xl">
            Welcome to Cross-Promotion!
          </h2>
          <p className="text-lg text-gray-600">
            Build your audience through strategic content partnerships
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
            <div className="mb-4 text-5xl">📝</div>
            <h3 className="mb-2 text-xl font-bold">Manage Your Queue</h3>
            <p className="text-gray-600">
              Add and organize your content that you want to promote
            </p>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-xl font-bold">Discover Matches</h3>
            <p className="text-gray-600">
              Find quality content from creators in your niche
            </p>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-left transition hover:border-black">
            <div className="mb-4 text-5xl">🚀</div>
            <h3 className="mb-2 text-xl font-bold">Share & Unlock</h3>
            <p className="text-gray-600">
              Share others' content to unlock your own in the queue
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowWelcome(false)}
          className="mx-auto mt-12 flex items-center justify-center gap-3 rounded-2xl bg-black px-10 py-5 text-xl font-bold text-white shadow-xl transition hover:bg-gray-800"
        >
          <Zap className="h-7 w-7" />
          Start Cross-Promoting
        </button>
      </div>
    </div>
  );

  // Step 1: Manage Content
  const ManageContentStep = () => (
    <div className="w-full">
      <div className="border-b-4 border-gray-900 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="emoji-3d shrink-0 text-5xl">📝</div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold">Manage Your Content</h3>
              <p className="text-gray-600">
                {(userContents || contents || []).length} item(s) in queue
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const contentsToSelect = Array.isArray(userContents)
                ? userContents
                : contents || [];
              setSelectedContents(contentsToSelect);
              if (onOpenManageModal) {
                onOpenManageModal();
              }
            }}
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Manage Queue
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        <List2
          contents={userContents || contents || []}
          onContentUpdated={onContentUpdated || onActivate}
          onContentDeleted={onContentDeleted || onDelete}
          selectedContents={selectedContents || []}
          setSelectedContents={setSelectedContents}
          queueStatus={queueStatus}
        />

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleNextStep}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:bg-gray-800 shadow-lg"
          >
            Next: Discover
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );

  // Step 2: Discover Matches
  const DiscoverMatchesStep = () => (
    <div className="w-full">
      <div className="border-b-4 border-gray-900 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="emoji-3d shrink-0 text-5xl">🔍</div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold">Discover & Select</h3>
              <p className="text-gray-600">{selectedMatches.length} selected</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border-2 border-gray-300">
              <button
                onClick={() => setReelViewMode("reel")}
                className={`px-3 py-2 rounded font-bold transition ${
                  reelViewMode === "reel"
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Film className="w-5 h-5" />
              </button>
              <button
                onClick={() => setReelViewMode("grid")}
                className={`px-3 py-2 rounded font-bold transition ${
                  reelViewMode === "grid"
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleShuffle}
              disabled={isShuffling}
              className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow whitespace-nowrap"
            >
              {isShuffling ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Shuffling...
                </>
              ) : isPremium ? (
                <>
                  <span>♾️</span>
                  Unlimited
                </>
              ) : (
                <>
                  <span>🎲</span>
                  {shuffleData?.total_shuffles || 0} left
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {reelViewMode === "reel" ? (
          <Reel
            onItemClick={() => {}}
            selectedMatches={selectedMatches}
            setSelectedMatches={setSelectedMatches}
            activeFilter={otherProps.activeFilter || "all"}
            searchResults={otherProps.searchResults || []}
            isSearchActive={otherProps.isSearchActive || false}
            shuffledPosts={shuffledMatches}
            onShuffleConsumed={() => setShuffledMatches(null)}
            onClearSearch={otherProps.onClearSearch}
            isPremium={isPremium}
            userContents={userContents || contents || []}
          />
        ) : (
          <List1
            matches={shuffledMatches || matches}
            selectedMatches={selectedMatches}
            setSelectedMatches={setSelectedMatches}
            loading={loading}
            shuffledPosts={shuffledMatches}
            onShuffleConsumed={() => setShuffledMatches(null)}
            isPremium={isPremium}
            userContents={userContents || contents || []}
            {...otherProps}
          />
        )}

        {!isPremium && shuffleData && shuffleData.total_shuffles <= 0 && (
          <div className="mt-6 rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white p-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚠️</span>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-yellow-800 mb-1">
                  Out of Shuffles
                </h4>
                <p className="text-sm text-yellow-700">
                  Upgrade to Premium for unlimited shuffles
                </p>
              </div>
              {onOpenPremiumModal && (
                <button
                  onClick={onOpenPremiumModal}
                  className="bg-black text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition whitespace-nowrap shadow-lg"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handlePrevStep}
            className="flex items-center gap-2 rounded-xl bg-gray-200 px-6 py-4 text-lg font-bold text-gray-700 transition hover:bg-gray-300"
          >
            <ChevronLeft className="h-6 w-6" />
            Back
          </button>
          <button
            onClick={handleNextStep}
            disabled={selectedMatches.length === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            Next: Share
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );

  // Step 3: Share Content
  const ShareContentStep = () => (
    <div className="w-full">
      <div className="border-b-4 border-gray-900 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="emoji-3d shrink-0 text-5xl">🚀</div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold">Share Content</h3>
              <p className="text-gray-600">
                {selectedMatches.length} ready to share
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        <ShareAndManage
          selectedMatches={selectedMatches}
          setSelectedMatches={setSelectedMatches}
          sharedContents={sharedContents}
          onUnshare={onUnshare}
          onShare={onShare}
          matches={shuffledMatches || matches}
          userContents={userContents || contents || []}
          onContentUpdated={onContentUpdated}
          onOpenPremiumModal={onOpenPremiumModal}
          onOpenContactsModal={onOpenContactsModal}
          isPremium={isPremium}
          user={{
            ...effectiveUser,
            is_ai_tier: effectiveUser?.is_premium || effectiveUser?.is_ai_tier,
          }}
          setIsAIModalOpen={otherProps.setIsAIModalOpen}
          setIsAIDashboardOpen={setIsAIDashboardOpen}
          {...otherProps}
        />

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handlePrevStep}
            className="flex items-center gap-2 rounded-xl bg-gray-200 px-6 py-4 text-lg font-bold text-gray-700 transition hover:bg-gray-300"
          >
            <ChevronLeft className="h-6 w-6" />
            Back
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-700 shadow-lg"
          >
            🎉 Complete Cycle
          </button>
        </div>
      </div>
    </div>
  );

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
              {currentStep === 1 && <ManageContentStep />}
              {currentStep === 2 && <DiscoverMatchesStep />}
              {currentStep === 3 && <ShareContentStep />}
            </main>
          </>
        )}
      </div>
    </>
  );
};

export default GuidedWorkflow;
