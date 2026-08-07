// frontend/src/pages/Home.jsx

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import ProfileCompletionBanner from "../components/ProfileCompletionBanner";
import List1 from "../components/List1";
import List2 from "../components/List2";
import { useApi } from "../lib/api";
import ShareAndManage from "../components/ShareAndManage";
import { toast } from "react-toastify";
import ManageContentModal from "../components/ManageContentModal";
import AnimatedProgressBar from "../components/AnimatedProgressBar";
import PremiumModal from "../components/PremiumModal";
import FilterDropdown from "../components/FilterDropdown";
import SearchModal from "../components/SearchModal";
import AddContentModal from "../components/AddContentModal";
import Reel from "../components/Reel";
import ProfileModal from "../components/ProfileModal";
import ViewModeToggle from "../components/ViewModeToggle";
import GuidedWorkflow from "../components/GuidedWorkflow";
import ContactsModal from "../components/ContactsModal";

const Home = () => {
  // 1. Define initialSteps FIRST (before any hooks)
  const initialSteps = [
    {
      id: "Step 1",
      href: "#",
      status: "upcoming",
      progress: 0,
    },
    {
      id: "Step 2",
      href: "#",
      status: "upcoming",
      progress: 0,
    },
    {
      id: "Step 3",
      href: "#",
      status: "upcoming",
      progress: 0,
    },
  ];

  // 2. All useState hooks
  const [steps, setSteps] = useState(initialSteps);
  const [userContents, setUserContents] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [selectedContents, setSelectedContents] = useState([]);
  const [totalSharesRequired, setTotalSharesRequired] = useState(0);
  const [currentShares, setCurrentShares] = useState(0);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showAIBanner, setShowAIBanner] = useState(true);
  const [isAIDashboardOpen, setIsAIDashboardOpen] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypes, setContentTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minViews, setMinViews] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [isStepInfoModalOpen, setIsStepInfoModalOpen] = useState(false);
  const [currentStepInfo, setCurrentStepInfo] = useState({
    title: "",
    description: "",
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("preferredViewMode") || "guided",
  );
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("standard");
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview");
  const [mobileStepIndex, setMobileStepIndex] = useState(0);
  const [remainingShuffles, setRemainingShuffles] = useState(0);
  const [bonusShuffles, setBonusShuffles] = useState(0);
  const [totalShuffles, setTotalShuffles] = useState(0);
  const [isOutOfShufflesModalOpen, setIsOutOfShufflesModalOpen] =
    useState(false);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [triggerSearchFlag, setTriggerSearchFlag] = useState(0);
  const [shuffledPosts, setShuffledPosts] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);

  // 3. All useContext hooks
  const { isPremium, user, isAITier, isAutopilotEnabled } =
    useContext(AuthContext);

  // 4. Custom hooks
  const {
    getContents,
    shuffleMatches,
    getRemainingShuffles,
    apiFetch,
    getQueueAutomationStatus,
  } = useApi();

  // 5. All useCallback hooks
  const handleSetSelectedContents = useCallback((value) => {
    setSelectedContents(value);
  }, []);

  // 6. All useEffect hooks
  useEffect(() => {
    const handleViewModeChange = () => {
      const newMode = localStorage.getItem("preferredViewMode") || "guided";
      console.log("📱 Home.jsx received view mode change:", newMode);
      setViewMode(newMode);
    };

    window.addEventListener("viewModeChanged", handleViewModeChange);
    return () =>
      window.removeEventListener("viewModeChanged", handleViewModeChange);
  }, []);

  useEffect(() => {
    if (!isPremium) {
      fetchShuffles();
    }
  }, [isPremium]);

  useEffect(() => {
    const handleOpenPremium = () => setIsPremiumModalOpen(true);
    window.addEventListener("openPremiumModal", handleOpenPremium);
    return () =>
      window.removeEventListener("openPremiumModal", handleOpenPremium);
  }, []);

  useEffect(() => {
    const handleOpenAddContent = () => setIsAddContentModalOpen(true);
    window.addEventListener("openAddContentModal", handleOpenAddContent);
    return () =>
      window.removeEventListener("openAddContentModal", handleOpenAddContent);
  }, []);

  useEffect(() => {
    const fetchUserContents = async () => {
      try {
        const data = await getContents();
        setUserContents(data);
      } catch (err) {
        console.error(err);
        setErrorUser(err.message || "Failed to fetch your contents.");
        toast.error("Failed to fetch your contents.");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUserContents();
  }, [getContents]);

  useEffect(() => {
    if (userContents.length > 0) {
      fetchQueueStatus();
    }
  }, [userContents]);

  useEffect(() => {
    if (totalSharesRequired === 0) return;

    const progress = (currentShares / totalSharesRequired) * 100;
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === "Step 3"
          ? { ...step, progress: Math.min(progress, 100) }
          : step,
      ),
    );
  }, [currentShares, totalSharesRequired]);

  useEffect(() => {
    const total = selectedMatches.reduce(
      (acc, match) => acc + (match.required_shares || 5),
      0,
    );
    setTotalSharesRequired(total);
    setCurrentShares(0);
  }, [selectedMatches]);

  useEffect(() => {
    const step3 = steps.find((step) => step.id === "Step 3");
    if (step3 && step3.progress >= 100) {
      toast.success("All content shared! Progress has been reset.");
      resetProgress();
    }
  }, [steps]);

  // 7. Regular functions (not hooks)
  const maxSteps = steps.length;

  const onOpenPremiumModal = () => {
    setIsPremiumModalOpen(true);
  };

  const onOpenContactsModal = () => {
    setIsContactsModalOpen(true);
  };

  const handleSearchResults = (results) => {
    console.log("Received search results:", results);
    setSearchResults(results);
    setIsSearchActive(true);
    setActiveFilter("search");
  };

  const handleSearch = async () => {
    try {
      const { searchContent } = useApi();
      const searchParams = {
        query: searchQuery.trim(),
        categories:
          categories.length > 0
            ? categories.map((cat) => cat.toLowerCase())
            : undefined,
        content_type:
          contentTypes.length > 0
            ? contentTypes.map((type) => type.toLowerCase())
            : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        min_views: minViews ? parseInt(minViews) : undefined,
        sort_by: sortBy,
      };

      console.log("Searching with params:", searchParams);
      const results = await searchContent(searchParams);

      handleSearchResults(results);
      setIsSearchModalOpen(false);

      if (results.length === 0) {
        toast.info("No results found for your search criteria.");
      } else {
        toast.success(`Found ${results.length} results.`);
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error(error.message || "Search failed. Please try again.");
    }
  };

  const handleNewSearch = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      setIsSearchModalOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setIsSearchActive(false);
    setActiveFilter("standard");
  };

  const handleSelectFilter = (filterValue) => {
    if (isSearchActive) {
      clearSearch();
    }

    if (filterValue === "standard") {
      setActiveFilter("standard");
    } else {
      if (isPremium) {
        setActiveFilter(filterValue);
      } else {
        setIsPremiumModalOpen(true);
      }
    }
  };

  const handleShuffle = async () => {
    if (!isPremium && remainingShuffles <= 0 && bonusShuffles <= 0) {
      setIsOutOfShufflesModalOpen(true);
      return;
    }

    setShuffleLoading(true);
    try {
      if (isSearchActive) {
        clearSearch();
      }

      const newMatches = await shuffleMatches();
      setShuffledPosts(newMatches.slice(0, 4));

      if (!isPremium) {
        await fetchShuffles();
      }

      toast.success("Matches shuffled successfully.");
    } catch (err) {
      console.error("Shuffle failed:", err);
      toast.error("Failed to shuffle matches.");
    } finally {
      setShuffleLoading(false);
    }
  };

  const trackFirstShare = () => {
    const hasShared = localStorage.getItem(`hasShared-${user?.id}`);
    if (!hasShared && window.gtag) {
      window.gtag("event", "first_share", {
        event_category: "Engagement",
        event_label: "First Content Share",
        value: 1,
      });
      localStorage.setItem(`hasShared-${user?.id}`, "true");
    }
  };

  const fetchShuffles = async () => {
    try {
      const data = await getRemainingShuffles();
      console.log("🔍 Shuffle data received:", data);

      if (data.remaining_shuffles === "Unlimited") {
        setRemainingShuffles(-1);
        setBonusShuffles(0);
        setTotalShuffles(-1);
      } else {
        const regular = data.remaining_shuffles || 0;
        const bonus = data.bonus_shuffles || 0;
        const total = regular + bonus;

        setRemainingShuffles(regular);
        setBonusShuffles(bonus);
        setTotalShuffles(total);

        console.log(
          `🔍 Shuffles set: ${regular} regular + ${bonus} bonus = ${total} total`,
        );
      }
    } catch (err) {
      console.error("Failed to fetch remaining shuffles:", err);
      toast.error("Failed to fetch remaining shuffles.");
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const data = await getQueueAutomationStatus();
      setQueueStatus(data);
    } catch (error) {
      console.error("Failed to fetch queue status:", error);
    }
  };

  const completeStep1 = () => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === "Step 1"
          ? { ...step, status: "complete", progress: 100 }
          : step,
      ),
    );
  };

  const completeStep2 = () => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === "Step 2"
          ? { ...step, status: "complete", progress: 100 }
          : step,
      ),
    );
  };

  const updateProgressBar = (contentId, requiredShares) => {
    setCurrentShares((prev) => prev + 1);
  };

  const resetProgress = () => {
    setSteps(initialSteps);
    setSelectedMatches([]);
    setSelectedContents([]);
  };

  const handleContentUpdated = (updatedContent) => {
    console.log("🏠 HOME - handleContentUpdated called with:", updatedContent);
    console.log("🏠 HOME - Updated content status:", updatedContent.status);

    setUserContents((prevContents) => {
      const newContents = prevContents.map((content) => {
        if (content.id === updatedContent.id) {
          console.log(
            `🏠 HOME - Updating content ${content.id} from ${content.status} to ${updatedContent.status}`,
          );
          return {
            ...updatedContent,
            _lastUpdated: Date.now(),
          };
        }
        return content;
      });

      console.log("🏠 HOME - Updated contents array:", newContents);
      return newContents;
    });

    fetchQueueStatus();
  };

  const handleContentAdded = (newContent) => {
    console.log("New content added:", newContent);
    setUserContents((prevContents) => [newContent, ...prevContents]);
  };

  const handleContentDeleted = (deletedContentId) => {
    setUserContents((prevContents) =>
      prevContents.filter((content) => content.id !== deletedContentId),
    );
  };

  const handleToggleRankedContent = () => {
    // Now handled by handleSelectFilter
  };

  const handleToggleTopPerformers = () => {
    // Now handled by handleSelectFilter
  };

  return (
    <div className="bg-white min-h-screen font-mono">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        {/* Conditional rendering based on viewMode */}
        {viewMode === "guided" ? (
          <GuidedWorkflow
            contents={userContents}
            onActivate={handleContentUpdated}
            onDeactivate={handleContentUpdated}
            onDelete={handleContentDeleted}
            onEdit={handleContentUpdated}
            matches={[]}
            selectedMatches={selectedMatches}
            setSelectedMatches={setSelectedMatches}
            loading={loadingUser}
            sharedContents={[]}
            onUnshare={() => {}}
            onShare={(contentId, requiredShares) => {
              updateProgressBar(contentId, requiredShares);
              trackFirstShare();
            }}
            userContents={userContents}
            onContentUpdated={handleContentUpdated}
            onContentDeleted={handleContentDeleted}
            selectedContents={selectedContents}
            setSelectedContents={handleSetSelectedContents}
            user={user}
            setIsAIModalOpen={setIsAIModalOpen}
            setIsAIDashboardOpen={setIsAIDashboardOpen}
            onOpenPremiumModal={onOpenPremiumModal}
            onOpenContactsModal={onOpenContactsModal}
            queueStatus={queueStatus}
            onOpenManageModal={() => setIsManageModalOpen(true)}
          />
        ) : (
          <>
            {/* Three-Column Layout */}
            <div className="flex flex-col md:flex-row md:space-x-4 mt-1 overflow-x-hidden">
              {/* Left Sidebar - Step 1 */}
              <aside
                id="step1"
                className={`flex flex-col md:flex-1 border-b md:border-b-0 md:border-r border-black pr-0 md:pr-4 pb-4 md:pb-0 md:pt-6 md:overflow-y-auto overflow-x-hidden min-w-0
${mobileStepIndex !== 0 ? "hidden md:flex" : ""}
`}
              >
                {/* Mobile Header */}
                <div className="block md:hidden mb-3 ">
                  <div
                    className="bg-white border border-gray-300 rounded p-3"
                    data-tour-id="step1-header"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded">
                          1
                        </span>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                          FIND YOUR MATCH
                        </h2>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        STEP 1/3
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-start">
                        <button
                          onClick={() => {
                            setCurrentStepInfo({
                              title: "FIND YOUR MATCH",
                              description:
                                "Browse through the content queue to find content that resonates with your audience.",
                            });
                            setIsStepInfoModalOpen(true);
                          }}
                          className="border border-gray-300 bg-white px-4 py-2 text-xs font-bold font-mono text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded transition"
                        >
                          HOW TO
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div data-tour-id="step1-introduction">
                  {/* Desktop Header */}
                  <div className="hidden md:block bg-white border border-gray-300 rounded p-4 mb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded">
                          1
                        </span>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                          FIND YOUR MATCH
                        </h2>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        STEP 1/3
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">
                        Browse through the content queue to find content that
                        resonates with your audience.
                      </p>
                    </div>
                  </div>
                  <FilterDropdown
                    data-tour-id="step3-content-queue"
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    isPremium={isPremium}
                    handleSelectFilter={handleSelectFilter}
                    onSearchResults={handleSearchResults}
                    onNewSearch={handleNewSearch}
                    triggerSearchFlag={triggerSearchFlag}
                    onViewModeChange={setViewMode}
                  />
                </div>
                <div className=" flex-1">
                  <div className=" flex-1">
                    {viewMode === "list" ? (
                      <List1
                        onItemClick={completeStep1}
                        selectedMatches={selectedMatches}
                        setSelectedMatches={setSelectedMatches}
                        activeFilter={activeFilter}
                        searchResults={searchResults}
                        isSearchActive={isSearchActive}
                        onClearSearch={clearSearch}
                        onNewSearch={handleNewSearch}
                        triggerRefresh={triggerSearchFlag}
                        shuffledPosts={shuffledPosts}
                        onShuffleConsumed={() => setShuffledPosts(null)}
                        isPremium={isPremium}
                        userContents={userContents}
                      />
                    ) : (
                      <Reel
                        onItemClick={completeStep1}
                        selectedMatches={selectedMatches}
                        setSelectedMatches={setSelectedMatches}
                        activeFilter={activeFilter}
                        searchResults={searchResults}
                        isSearchActive={isSearchActive}
                        onClearSearch={clearSearch}
                        onNewSearch={handleNewSearch}
                        triggerRefresh={triggerSearchFlag}
                        shuffledPosts={shuffledPosts}
                        onShuffleConsumed={() => setShuffledPosts(null)}
                        isPremium={isPremium}
                        onShuffle={handleShuffle}
                        shuffleLoading={shuffleLoading}
                        remainingShuffles={remainingShuffles}
                      />
                    )}
                  </div>

                  {/* Mobile Shuffle and Next Buttons */}
                  <div className="block md:hidden px-2 mt-4 mb-20">
                    <div className="flex gap-2">
                      <button
                        aria-label="Shuffle Matches"
                        onClick={() => {
                          if (!isPremium && remainingShuffles <= 0) {
                            setIsPremiumModalOpen(true);
                          } else {
                            handleShuffle();
                          }
                        }}
                        disabled={shuffleLoading}
                        className={[
                          "w-1/2 rounded border border-black bg-white px-4 py-2 text-sm font-bold font-mono text-black shadow-sm",
                          "hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black transition",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        ].join(" ")}
                      >
                        {!isPremium ? (
                          shuffleLoading ? (
                            <span>⏳...</span>
                          ) : remainingShuffles <= 0 ? (
                            <span>⚡ UPGRADE</span>
                          ) : (
                            <span>🎲 {remainingShuffles}</span>
                          )
                        ) : shuffleLoading ? (
                          <span>⏳...</span>
                        ) : (
                          <span>♾️</span>
                        )}
                      </button>

                      <button
                        data-tour-id="step0-next"
                        className="w-1/2 rounded bg-black text-white font-bold py-2"
                        onClick={() => setMobileStepIndex(1)}
                      >
                        Next →
                      </button>
                    </div>

                    {!isPremium &&
                      remainingShuffles <= 0 &&
                      !shuffleLoading && (
                        <div className="text-xs font-mono text-center text-gray-600 mt-2">
                          💡 TAP TO UPGRADE FOR UNLIMITED SHUFFLES
                        </div>
                      )}
                  </div>

                  {/* Desktop Shuffle Button */}
                  <div className="hidden md:flex mt-4 px-2 justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        aria-label="Shuffle Matches"
                        onClick={() => {
                          if (!isPremium && remainingShuffles <= 0) {
                            setIsPremiumModalOpen(true);
                          } else {
                            handleShuffle();
                          }
                        }}
                        data-tour-id="step3-shuffle-button"
                        disabled={shuffleLoading}
                        className={[
                          "rounded border border-black bg-black px-8 py-2 text-sm font-bold font-mono text-white shadow-sm",
                          "hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-black transition",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white",
                        ].join(" ")}
                      >
                        {!isPremium ? (
                          shuffleLoading ? (
                            <span>⏳ SHUFFLING...</span>
                          ) : remainingShuffles <= 0 ? (
                            <span>⚡ UPGRADE FOR UNLIMITED</span>
                          ) : (
                            <span>🎲 SHUFFLES: {remainingShuffles}</span>
                          )
                        ) : shuffleLoading ? (
                          <span>⏳ SHUFFLING...</span>
                        ) : (
                          <span>♾️ UNLIMITED SHUFFLES</span>
                        )}
                      </button>

                      {!isPremium &&
                        remainingShuffles <= 0 &&
                        !shuffleLoading && (
                          <div className="mt-1 font-mono text-[11px] text-center"></div>
                        )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content - Step 2 */}
              <main
                id="step2"
                data-tour-id="step4-manage-section"
                className={`flex flex-col md:flex-1 border-b md:border-b-0 md:border-r border-black px-0 md:px-4 pb-4 md:pb-0 md:pt-6 min-h-0 md:min-h-[calc(100vh-5rem)] overflow-x-hidden
      ${mobileStepIndex !== 1 ? "hidden md:flex" : ""}
    `}
              >
                {/* Mobile Header */}
                <div className="block md:hidden mb-3 ">
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex items-center justify-between ">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded flex items-center justify-center">
                          2
                        </span>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                          CHOOSE CONTENT TO SHARE
                        </h2>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        STEP 2/3
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center gap-3">
                        <button
                          onClick={() => {
                            setCurrentStepInfo({
                              title: "CHOOSE CONTENT TO SHARE",
                              description:
                                "Select content you want others to share with their audience and then Activate it",
                            });
                            setIsStepInfoModalOpen(true);
                          }}
                          className="border border-gray-300 bg-white px-4 py-2 text-xs font-bold font-mono text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded transition"
                        >
                          HOW TO
                        </button>
                        <button
                          type="button"
                          data-tour-id="step4-manage-button"
                          className="border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-bold font-mono text-white hover:bg-white hover:text-gray-900 rounded transition"
                          onClick={() => {
                            const contentsToSelect = Array.isArray(userContents)
                              ? userContents
                              : [];
                            setSelectedContents(contentsToSelect);
                            setIsManageModalOpen(true);
                          }}
                        >
                          MANAGE CONTENT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:block mb-2">
                  <div className="bg-white border border-gray-300 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded flex items-center justify-center">
                          2
                        </span>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                          CHOOSE CONTENT TO SHARE
                        </h2>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        STEP 2/3
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mb-3">
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">
                        Add content using the sidebar, then manage and activate
                        it here.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        data-tour-id="step4-manage-button"
                        className="border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-bold font-mono text-white hover:bg-white hover:text-gray-900 rounded transition"
                        onClick={() => {
                          const contentsToSelect = Array.isArray(userContents)
                            ? userContents
                            : [];
                          setSelectedContents(contentsToSelect);
                          setIsManageModalOpen(true);
                        }}
                      >
                        MANAGE CONTENT
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  {loadingUser ? (
                    <div className="text-gray-500 font-mono text-base px-2">
                      Loading your content...
                    </div>
                  ) : errorUser ? (
                    <div className="text-red-500 font-mono text-base px-2">
                      {errorUser}
                    </div>
                  ) : (
                    <List2
                      onItemClick={completeStep2}
                      contents={userContents}
                      onContentUpdated={handleContentUpdated}
                      onContentDeleted={handleContentDeleted}
                      selectedContents={selectedContents}
                      setSelectedContents={handleSetSelectedContents}
                      queueStatus={queueStatus}
                    />
                  )}
                </div>
                {/* Mobile Navigation */}
                <div className=" md:hidden px-2 mt-4 flex gap-2">
                  <button
                    className="w-1/2 rounded bg-gray-200 text-black font-bold py-2"
                    onClick={() => setMobileStepIndex(0)}
                  >
                    ← Back
                  </button>
                  <button
                    className="w-1/2 rounded bg-black text-white font-bold py-2"
                    onClick={() => setMobileStepIndex(2)}
                  >
                    Next: →
                  </button>
                </div>
              </main>

              {/* Step 3 Mobile Section */}
              {mobileStepIndex === 2 && (
                <div
                  id="step3"
                  className="block xl:hidden mt-4"
                  data-tour-id="mobile-share-section"
                >
                  {/* Mobile Header */}
                  <div className="mb-3 ">
                    <div className="bg-white border border-gray-300 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded flex items-center justify-center">
                            3
                          </span>
                          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                            SHARE & MANAGE
                          </h2>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          STEP 3/3
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              setCurrentStepInfo({
                                title: "SHARE & MANAGE",
                                description:
                                  "Select contacts to share with and manage content status",
                              });
                              setIsStepInfoModalOpen(true);
                            }}
                            className="border border-gray-300 bg-white px-4 py-2 text-xs font-bold font-mono text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded transition"
                          >
                            HOW TO
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="mt-4 overflow-x-hidden">
                    <ShareAndManage
                      selectedMatches={selectedMatches}
                      selectedContents={selectedContents}
                      userContents={userContents}
                      onShare={(contentId, requiredShares) => {
                        updateProgressBar(contentId, requiredShares);
                        trackFirstShare();
                      }}
                      user={user}
                      onContentUpdated={handleContentUpdated}
                      setIsAIModalOpen={setIsAIModalOpen}
                      setIsAIDashboardOpen={setIsAIDashboardOpen}
                      onOpenPremiumModal={onOpenPremiumModal}
                      onOpenContactsModal={onOpenContactsModal}
                    />
                  </div>

                  {/* Navigation buttons */}
                  <div className="px-2 mt-4 mb-20 flex gap-2">
                    <button
                      className="w-1/2 rounded bg-gray-200 text-black font-bold py-2"
                      onClick={() => setMobileStepIndex(1)}
                    >
                      ← Back
                    </button>
                    <button
                      className="w-1/2 rounded bg-black text-white font-bold py-2"
                      onClick={() => setMobileStepIndex(0)}
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}
              {/* Right Sidebar - Step 3 */}
              <aside
                className="sticky top-8 hidden xl:flex flex-col flex-1 pl-4 pt-6 min-w-0"
                data-tour-id="step5-share-manage"
              >
                <div className="mb">
                  <div className="bg-white border border-gray-300 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded flex items-center justify-center">
                          3
                        </span>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                          SHARE AND MANAGE
                        </h2>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        STEP 3/3
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">
                        Select contacts to share with and manage content status
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 mt-4 overflow-y-auto overflow-x-hidden">
                  <ShareAndManage
                    selectedMatches={selectedMatches}
                    selectedContents={selectedContents}
                    userContents={userContents}
                    onShare={(contentId, requiredShares) => {
                      updateProgressBar(contentId, requiredShares);
                      trackFirstShare();
                    }}
                    user={user}
                    onContentUpdated={handleContentUpdated}
                    setIsAIModalOpen={setIsAIModalOpen}
                    setIsAIDashboardOpen={setIsAIDashboardOpen}
                    onOpenPremiumModal={onOpenPremiumModal}
                    onOpenContactsModal={onOpenContactsModal}
                  />
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
      {/* Modals */}
      <AddContentModal
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
        onContentAdded={handleContentAdded}
      />
      <ManageContentModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        selectedContents={selectedContents}
      />

      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
      />
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />

      {isPremium && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          setCategories={setCategories}
          contentTypes={contentTypes}
          setContentTypes={setContentTypes}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          minViews={minViews}
          setMinViews={setMinViews}
          sortBy={sortBy}
          setSortBy={setSortBy}
          handleSearch={handleSearch}
          onSearchResults={handleSearchResults}
          isPremium={isPremium}
        />
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={user?.id}
      />

      {/* Step Info Modal */}
      {isStepInfoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                {currentStepInfo.title}
              </h3>
              <button
                onClick={() => setIsStepInfoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-700 font-mono leading-relaxed mb-4">
              {currentStepInfo.description}
            </p>
            <button
              onClick={() => setIsStepInfoModalOpen(false)}
              className="w-full bg-gray-900 text-white px-4 py-2 text-xs font-bold font-mono rounded hover:bg-gray-800 transition"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
