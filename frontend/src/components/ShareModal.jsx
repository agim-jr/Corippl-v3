// frontend/src/components/ShareModal.jsx

"use client";

import React, { Fragment, useState, useEffect, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import { useApi } from "../lib/api";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

// Terminal-style scrollbar
const scrollbarStyles = `
  .share-modal-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .share-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .share-modal-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .share-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }
`;

// ✅ NEW: Animated Credit Display Component
const AnimatedCreditDisplay = ({ credits }) => {
  const [prevCredits, setPrevCredits] = useState(credits);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showChange, setShowChange] = useState(null);

  useEffect(() => {
    if (credits !== prevCredits) {
      const change = credits - prevCredits;
      setShowChange(change);
      setIsAnimating(true);

      // Reset animation after 2 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowChange(null);
        setPrevCredits(credits);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [credits, prevCredits]);

  return (
    <div className="relative inline-block">
      <div
        className={`text-2xl font-bold transition-all duration-300 ${
          isAnimating ? "scale-110 text-green-600" : "text-gray-900"
        }`}
      >
        💰 {credits}
      </div>

      {/* Animated change indicator */}
      {showChange !== null && (
        <div
          className={`absolute -top-2 -right-2 text-xs font-bold animate-bounce ${
            showChange > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {showChange > 0 ? "+" : ""}
          {showChange}
        </div>
      )}
    </div>
  );
};

// ✅ NEW: Credit Transaction History Component
const CreditHistory = ({ transactions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transactions || transactions.length === 0) return null;

  return (
    <div className="bg-purple-50 border-2 border-purple-300 rounded">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            💳 Recent Activity
          </span>
          <span className="text-xs text-gray-600">({transactions.length})</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-purple-200 space-y-1 max-h-48 overflow-y-auto share-modal-scroll">
          {transactions.slice(0, 10).map((tx, i) => (
            <div
              key={i}
              className={`p-2 rounded text-xs flex items-center justify-between ${
                tx.type === "earned"
                  ? "bg-green-100 text-green-900"
                  : "bg-red-100 text-red-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{tx.type === "earned" ? "✅" : "🔓"}</span>
                <div>
                  <div className="font-medium">{tx.message}</div>
                  <div className="text-xs opacity-75">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <span className="font-bold">
                {tx.type === "earned" ? "+" : "-"}
                {Math.abs(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ShareModal = ({
  isOpen,
  onClose,
  selectedContent = {},
  selectedContacts = [],
  handleContactSelection,
  handleShare: originalHandleShare,
  onOpenPremiumModal,
  onOpenContactsModal,
}) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailySharesRemaining, setDailySharesRemaining] = useState(null);
  const [loadingShares, setLoadingShares] = useState(false);

  // AI Recommendations State
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);

  // Queue Status State
  const [queueStatus, setQueueStatus] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // ✅ NEW: Credit Transaction History State
  const [creditTransactions, setCreditTransactions] = useState([]);

  const {
    fetchContacts,
    getUserShareInfo,
    getAIContactRecommendations,
    apiFetch,
  } = useApi();
  const { user } = useContext(AuthContext);

  // ✅ NEW: Load credit transactions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("creditTransactions");
    if (saved) {
      try {
        setCreditTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load credit transactions:", e);
      }
    }
  }, []);

  // ✅ NEW: Helper to add credit transaction
  const addCreditTransaction = (type, amount, message) => {
    const newTx = {
      type, // 'earned' or 'spent'
      amount,
      message,
      timestamp: Date.now(),
    };

    const updated = [newTx, ...creditTransactions].slice(0, 20); // Keep last 20
    setCreditTransactions(updated);
    localStorage.setItem("creditTransactions", JSON.stringify(updated));
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      loadSharesRemaining();
      loadQueueStatus();

      // Load AI recommendations if premium and content selected
      if (user?.is_premium && selectedContent?.id) {
        loadAIRecommendations();
      }
    }
  }, [isOpen, selectedContent?.id]);

  // ✅ NEW: Listen for contact updates from ContactsModal
  useEffect(() => {
    const handleContactsUpdated = () => {
      if (isOpen) {
        console.log("Contacts updated, reloading...");
        loadContacts();
      }
    };

    window.addEventListener("contactsUpdated", handleContactsUpdated);

    return () => {
      window.removeEventListener("contactsUpdated", handleContactsUpdated);
    };
  }, [isOpen]);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedContacts = await fetchContacts();
      setContacts(fetchedContacts);
    } catch (err) {
      setError(err.message || "Failed to fetch contacts.");
      toast.error("Failed to fetch contacts.");
    } finally {
      setLoading(false);
    }
  };

  const loadSharesRemaining = async () => {
    if (!user?.is_premium) {
      setLoadingShares(true);
      try {
        const data = await getUserShareInfo();
        const remaining =
          typeof data.shares_remaining === "string"
            ? 999
            : data.shares_remaining;
        setDailySharesRemaining(Math.max(0, remaining));
      } catch (err) {
        console.error("Failed to fetch share info:", err);
        setDailySharesRemaining(0);
      } finally {
        setLoadingShares(false);
      }
    }
  };

  const loadQueueStatus = async () => {
    setLoadingQueue(true);
    try {
      const response = await apiFetch("/content/queue/status");
      if (!response.ok) {
        throw new Error("Failed to fetch queue status");
      }
      const data = await response.json();
      setQueueStatus(data);
    } catch (err) {
      console.error("Failed to fetch queue status:", err);
      setQueueStatus(null);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadAIRecommendations = async () => {
    if (!selectedContent?.id) {
      return;
    }

    setLoadingAI(true);

    try {
      const response = await getAIContactRecommendations(selectedContent.id, 5);

      let recommendations = [];

      if (Array.isArray(response)) {
        recommendations = response;
      } else if (
        response?.recommendations &&
        Array.isArray(response.recommendations)
      ) {
        recommendations = response.recommendations;
      } else if (response?.data && Array.isArray(response.data)) {
        recommendations = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        recommendations = response.results;
      }

      setAiRecommendations(recommendations);
    } catch (err) {
      console.error("Failed to load AI recommendations:", err);
      setAiRecommendations([]);
    } finally {
      setLoadingAI(false);
    }
  };

  // ✅ NEW: Enhanced handleShare with visual feedback
  const handleShare = async () => {
    const beforeCredits = queueStatus?.share_credits || 0;
    const beforeQueue = pendingContent.length;

    try {
      // Call original share handler
      await originalHandleShare();

      // Show immediate feedback for earning credit
      toast.success(
        <div className="space-y-1">
          <div className="font-bold">✅ Content Shared!</div>
          <div className="text-xs">+1 Share Credit Earned</div>
        </div>,
        { autoClose: 3000 },
      );

      // Add transaction record
      addCreditTransaction(
        "earned",
        1,
        `Shared "${selectedContent.title?.substring(0, 30)}..."`,
      );

      // Wait a moment then reload queue and check for unlocks
      setTimeout(async () => {
        await loadQueueStatus();

        // Check if content was unlocked (after state updates)
        setTimeout(() => {
          const afterQueue = (queueStatus?.queue_items || []).filter((item) => {
            const status = item.status?.toLowerCase();
            return (
              status === "pending" || status === "queued" || !item.is_active
            );
          }).length;

          if (beforeQueue > afterQueue) {
            const unlockedCount = beforeQueue - afterQueue;
            toast.success(
              <div className="space-y-1">
                <div className="font-bold">🎉 Content Unlocked!</div>
                <div className="text-xs">
                  {unlockedCount} item{unlockedCount === 1 ? "" : "s"} moved
                  from pending → active
                </div>
                <div className="text-xs opacity-75">
                  -{unlockedCount} credit{unlockedCount === 1 ? "" : "s"} spent
                </div>
              </div>,
              { autoClose: 5000 },
            );

            // Add transaction record for unlock
            addCreditTransaction(
              "spent",
              unlockedCount,
              `Unlocked ${unlockedCount} content item${unlockedCount === 1 ? "" : "s"}`,
            );
          }
        }, 500);
      }, 1000);
    } catch (err) {
      // Error already handled by originalHandleShare
      console.error("Share failed:", err);
    }
  };

  const handleUpgradeClick = () => {
    if (onOpenPremiumModal) {
      onClose();
      onOpenPremiumModal();
    } else {
      toast.info("Premium upgrade is currently unavailable.");
    }
  };

  const handleSelectAllRecommended = () => {
    aiRecommendations.forEach((rec) => {
      if (!selectedContacts.includes(rec.contact_id)) {
        handleContactSelection(rec.contact_id);
      }
    });
    toast.success(
      `Selected ${aiRecommendations.length} AI-recommended contacts!`,
    );
  };

  // Separate contacts into recommended and non-recommended
  const recommendedContactIds = aiRecommendations.map((r) => r.contact_id);
  const otherContacts = contacts.filter(
    (c) => !recommendedContactIds.includes(c.id),
  );

  // Get pending content from queue (FIFO order)
  const allQueueItems = queueStatus?.queue_items || [];
  const pendingContent = allQueueItems.filter((item) => {
    const status = item.status?.toLowerCase();
    return status === "pending" || status === "queued" || !item.is_active;
  });

  const nextToUnlock = pendingContent[0];
  const shareCredits = queueStatus?.share_credits || 0;
  const hasAnyPendingContent = pendingContent.length > 0;
  const hasQueueData = queueStatus !== null && allQueueItems.length > 0;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
        <style>{scrollbarStyles}</style>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-70"
          leave="ease-in duration-200"
          leaveFrom="opacity-70"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                  <Dialog.Title className="text-lg font-bold uppercase">
                    Share Content
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded border border-black hover:bg-black hover:text-white transition"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-4">
                  {/* Daily Shares Warning Banner */}
                  {!user?.is_premium &&
                    dailySharesRemaining !== null &&
                    !loadingShares && (
                      <div
                        className={`p-3 rounded border-2 ${
                          dailySharesRemaining === 0
                            ? "bg-gray-100 border-black"
                            : dailySharesRemaining === 1
                              ? "bg-gray-50 border-gray-400"
                              : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-start">
                          <span className="text-lg mr-2">
                            {dailySharesRemaining === 0
                              ? "🚫"
                              : dailySharesRemaining === 1
                                ? "⚠️"
                                : "ℹ️"}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black">
                              {dailySharesRemaining === 0 ? (
                                <>
                                  You've used all your daily shares.{" "}
                                  <button
                                    onClick={handleUpgradeClick}
                                    className="font-bold text-black hover:text-gray-700 underline inline-block"
                                  >
                                    Upgrade to Premium
                                  </button>{" "}
                                  for unlimited sharing!
                                </>
                              ) : (
                                <>
                                  You have{" "}
                                  <span className="font-bold">
                                    {dailySharesRemaining} share
                                    {dailySharesRemaining === 1 ? "" : "s"}
                                  </span>{" "}
                                  remaining today.
                                </>
                              )}
                            </p>
                            {dailySharesRemaining <= 1 && (
                              <p className="text-xs mt-1 text-gray-600">
                                {dailySharesRemaining === 0 ? (
                                  <>
                                    Premium users get unlimited shares • Cancel
                                    anytime
                                  </>
                                ) : (
                                  <>
                                    Premium users get unlimited shares •{" "}
                                    <button
                                      onClick={handleUpgradeClick}
                                      className="underline hover:text-black"
                                    >
                                      Upgrade now
                                    </button>
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {loadingShares && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-600">
                          Loading share limit...
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedContent && selectedContent.title ? (
                    <>
                      {/* Selected Content Info */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Content to Share
                        </label>
                        <div className="p-3 bg-gray-50 border-2 border-black rounded">
                          <h3 className="font-bold text-black text-sm">
                            {selectedContent.title}
                          </h3>
                          {selectedContent.description && (
                            <p className="text-xs text-gray-700 mt-1">
                              {selectedContent.description.substring(0, 100)}
                              {selectedContent.description.length > 100 &&
                                "..."}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ✅ NEW: Credit Transaction History */}
                      {creditTransactions.length > 0 && (
                        <CreditHistory transactions={creditTransactions} />
                      )}

                      {/* Queue Status Display */}
                      {!loadingQueue && queueStatus && hasQueueData && (
                        <div className="space-y-3">
                          {/* ✅ UPDATED: Share Credits Display with Animation */}
                          {shareCredits > 0 && (
                            <div className="p-3 bg-green-50 border-2 border-green-500 rounded">
                              <div className="flex items-start gap-3">
                                <AnimatedCreditDisplay credits={shareCredits} />
                                <div className="flex-1">
                                  <div className="text-sm font-bold text-green-900 mb-1">
                                    Share Credit
                                    {shareCredits === 1 ? "" : "s"} Available
                                  </div>
                                  <div className="text-xs text-green-800">
                                    {shareCredits === 1
                                      ? "Use it to unlock your next content automatically."
                                      : pendingContent.length > 0
                                        ? `Ready to unlock your next ${Math.min(shareCredits, pendingContent.length)} item${Math.min(shareCredits, pendingContent.length) === 1 ? "" : "s"} automatically.`
                                        : "These will apply to your next content submission."}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Next to Unlock OR All Content Unlocked */}
                          {hasAnyPendingContent && nextToUnlock ? (
                            <div className="p-4 bg-blue-50 border-2 border-blue-500 rounded">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🎯</span>
                                <div className="flex-1">
                                  <div className="text-sm font-bold text-blue-900 mb-2">
                                    {shareCredits > 0
                                      ? "Ready to Unlock"
                                      : "Next to Unlock Automatically"}
                                  </div>

                                  <div className="p-3 bg-white rounded border border-blue-200">
                                    <div className="text-xs font-bold text-gray-900 mb-1">
                                      "{nextToUnlock.title}"
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-2 flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        {new Date(
                                          nextToUnlock.created_at,
                                        ).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <QueueListIcon className="h-3 w-3" />
                                        Position #1
                                      </span>
                                    </div>
                                  </div>

                                  {shareCredits > 0 ? (
                                    <div className="mt-3 text-xs text-blue-800 font-medium">
                                      ✅ This content will unlock as soon as you
                                      share!
                                    </div>
                                  ) : (
                                    <div className="mt-3 text-xs text-blue-800">
                                      Share with{" "}
                                      <strong>
                                        {selectedContacts.length || "___"}
                                      </strong>{" "}
                                      contact
                                      {selectedContacts.length === 1
                                        ? ""
                                        : "s"}{" "}
                                      to earn 1 credit and unlock this content
                                    </div>
                                  )}

                                  {pendingContent.length > 1 && (
                                    <div className="mt-2 text-xs text-blue-700 flex items-center gap-1">
                                      <QueueListIcon className="h-3 w-3" />
                                      {pendingContent.length - 1} more item
                                      {pendingContent.length - 1 === 1
                                        ? ""
                                        : "s"}{" "}
                                      in queue
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* All Content Unlocked */
                            <div className="p-4 bg-green-50 border-2 border-green-500 rounded">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">✅</span>
                                <div className="flex-1">
                                  <div className="text-sm font-bold text-green-900 mb-1">
                                    All Your Content is Live!
                                  </div>
                                  <div className="text-xs text-green-800">
                                    {shareCredits > 0
                                      ? `Great news: All your content is now active and visible to others. You have ${shareCredits} unused credit${shareCredits === 1 ? "" : "s"} that will be applied to your next submission.`
                                      : "Great news: All your content is now active and visible to others. Keep sharing matched content to help grow the community!"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Loading Queue */}
                      {loadingQueue && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                          <div className="flex items-center justify-center gap-2">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                            <span className="text-sm text-gray-600">
                              Loading queue status...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* No Queue Data Yet */}
                      {!loadingQueue && (!queueStatus || !hasQueueData) && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                          <div className="text-center text-xs text-gray-600">
                            <p>Submit content to see your unlock queue here.</p>
                          </div>
                        </div>
                      )}

                      {/* AI Recommended Contacts - PREMIUM FEATURE */}
                      {user?.is_premium && aiRecommendations.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600">
                              <SparklesIcon className="h-4 w-4 text-black" />
                              AI Recommended for This Content
                            </label>
                            <button
                              onClick={handleSelectAllRecommended}
                              className="text-xs text-black hover:text-gray-700 font-medium underline"
                            >
                              Select All ({aiRecommendations.length})
                            </button>
                          </div>
                          <div className="p-3 bg-white border-2 border-black rounded">
                            {loadingAI ? (
                              <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                                <p className="text-xs text-gray-600 mt-2">
                                  AI analyzing best contacts...
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto share-modal-scroll">
                                {aiRecommendations.map((rec) => {
                                  const contact = contacts.find(
                                    (c) => c.id === rec.contact_id,
                                  );
                                  const isSelected = selectedContacts.includes(
                                    rec.contact_id,
                                  );

                                  return (
                                    <div
                                      key={rec.contact_id}
                                      onClick={() =>
                                        handleContactSelection(rec.contact_id)
                                      }
                                      className={`p-3 rounded border-2 cursor-pointer transition-all ${
                                        isSelected
                                          ? "bg-gray-100 border-black shadow-sm"
                                          : "bg-white border-gray-300 hover:border-black hover:shadow-sm"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h4 className="text-sm font-bold text-gray-900">
                                              {contact?.name || "Unknown"}
                                            </h4>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-black text-white">
                                              {rec.ai_score}% Match
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600 mb-2 truncate">
                                            {contact?.email}
                                          </p>
                                          <div className="flex items-start gap-1">
                                            <SparklesIcon className="h-3 w-3 text-black mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-700 break-words">
                                              {rec.recommendation_reason}
                                            </p>
                                          </div>
                                          {rec.best_send_time && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              💡 Best time: {rec.best_send_time}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex-shrink-0">
                                          {isSelected ? (
                                            <CheckCircleIcon className="h-6 w-6 text-black" />
                                          ) : (
                                            <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* All Contacts Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold uppercase text-gray-600">
                            {user?.is_premium && aiRecommendations.length > 0
                              ? "All Other Contacts"
                              : "Select Recipients"}
                          </label>
                          {contacts.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {selectedContacts.length} of {contacts.length}{" "}
                              selected
                            </span>
                          )}
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                          {loading ? (
                            <div className="text-center py-2 text-sm text-gray-600">
                              Loading contacts...
                            </div>
                          ) : error ? (
                            <div className="text-center py-2">
                              <div className="text-sm text-gray-700 mb-2">
                                {error}
                              </div>
                              <button
                                onClick={loadContacts}
                                className="px-3 py-1 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition"
                              >
                                Retry
                              </button>
                            </div>
                          ) : contacts.length === 0 ? (
                            <div className="text-center py-4">
                              <div className="text-3xl mb-2">📇</div>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                No contacts yet
                              </div>
                              <div className="text-xs text-gray-600 mb-3">
                                Add contacts first before you can share content
                              </div>
                              {onOpenContactsModal ? (
                                <button
                                  onClick={() => {
                                    onOpenContactsModal();
                                  }}
                                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 transition border-2 border-black"
                                >
                                  + Add Contacts
                                </button>
                              ) : (
                                <div className="text-xs text-gray-500 mt-2">
                                  Go to Contacts page to add recipients
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* Show/Hide toggle for non-recommended contacts when AI recommendations exist */}
                              {user?.is_premium &&
                                aiRecommendations.length > 0 &&
                                otherContacts.length > 0 && (
                                  <button
                                    onClick={() =>
                                      setShowAllContacts(!showAllContacts)
                                    }
                                    className="w-full mb-2 px-3 py-2 text-xs font-medium text-black bg-white border-2 border-black rounded hover:bg-gray-50 transition"
                                  >
                                    {showAllContacts
                                      ? `Hide ${otherContacts.length} other contact${otherContacts.length === 1 ? "" : "s"}`
                                      : `Show ${otherContacts.length} other contact${otherContacts.length === 1 ? "" : "s"}`}
                                  </button>
                                )}

                              {/* Contact List */}
                              {(!user?.is_premium ||
                                aiRecommendations.length === 0 ||
                                showAllContacts) && (
                                <div className="share-modal-scroll max-h-48 overflow-y-auto bg-white border border-gray-300 rounded">
                                  <ul className="divide-y divide-gray-200">
                                    {(user?.is_premium &&
                                    aiRecommendations.length > 0
                                      ? otherContacts
                                      : contacts
                                    ).map((contact) => (
                                      <li key={contact.id} className="p-2">
                                        <label
                                          htmlFor={`contact-${contact.id}`}
                                          className="flex items-center cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            id={`contact-${contact.id}`}
                                            value={contact.id}
                                            checked={selectedContacts.includes(
                                              contact.id,
                                            )}
                                            onChange={() =>
                                              handleContactSelection(contact.id)
                                            }
                                            className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
                                          />
                                          <div className="ml-3 flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900">
                                              {contact.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                              {contact.email}
                                            </div>
                                          </div>
                                        </label>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* ✅ UPDATED: Share Button with Credit Flow Preview */}
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={handleShare}
                          disabled={
                            selectedContacts.length === 0 ||
                            (!user?.is_premium && dailySharesRemaining === 0) ||
                            loadingShares
                          }
                          className={`w-full px-4 py-3 text-sm font-medium rounded border-2 transition ${
                            selectedContacts.length === 0 ||
                            (!user?.is_premium && dailySharesRemaining === 0) ||
                            loadingShares
                              ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                              : "bg-black text-white border-black hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className="font-bold">
                              {loadingShares
                                ? "Checking limits..."
                                : !user?.is_premium &&
                                    dailySharesRemaining === 0
                                  ? "Daily limit reached - Upgrade to share"
                                  : selectedContacts.length === 0
                                    ? "Select contacts to share"
                                    : `📤 Share with ${selectedContacts.length} contact${selectedContacts.length === 1 ? "" : "s"}`}
                            </div>

                            {/* ✅ NEW: Show credit flow */}
                            {selectedContacts.length > 0 &&
                              dailySharesRemaining !== 0 && (
                                <div className="text-xs opacity-90 flex items-center gap-2 flex-wrap justify-center">
                                  <span className="text-green-400">
                                    +1 credit
                                  </span>
                                  {hasAnyPendingContent && (
                                    <>
                                      <span>•</span>
                                      <span className="text-red-400">
                                        -1 unlock
                                      </span>
                                      <span>•</span>
                                      <span className="text-yellow-400">
                                        = {shareCredits} credits after
                                      </span>
                                    </>
                                  )}
                                  {!hasAnyPendingContent &&
                                    shareCredits >= 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-yellow-400">
                                          = {shareCredits + 1} credits after
                                        </span>
                                      </>
                                    )}
                                </div>
                              )}
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        No Content Selected
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-center">
                        Please select content to share.
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {user?.is_premium
                        ? "AI recommendations help you share smarter"
                        : loadingShares
                          ? "Loading share limit..."
                          : `Free users: ${dailySharesRemaining ?? "..."}/3 shares today • Premium: Unlimited`}
                    </span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ShareModal;
