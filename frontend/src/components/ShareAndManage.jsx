import { useCallback } from "react";
import React, { useState, useEffect, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import ShareModal from "./ShareModal";
import { ClockIcon } from "@heroicons/react/24/outline";

const scrollbarStyles = `
  .share-manage-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .share-manage-scrollbar::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 4px;
  }
  .share-manage-scrollbar::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  .share-manage-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #000 #f5f5f5;
  }
`;

const ShareAndManage = ({
  selectedMatches = [],
  selectedContents = [],
  userContents = [],
  onShare,
  user,
  onContentUpdated,
  onOpenContactsModal,
  onOpenPremiumModal,
}) => {
  const {
    shareContent,
    shareGuestContent,
    fetchContacts,
    toggleReciprocalAutopilot,
    toggleContentAutoShare,
  } = useApi();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [autopilotStatus, setAutopilotStatus] = useState(
    user?.autopilot_enabled || false,
  );
  const [isMatchedContentModalOpen, setIsMatchedContentModalOpen] =
    useState(false);

  // Fetch contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await fetchContacts();
        setContacts(data);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to fetch contacts.");
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [fetchContacts]);

  // Update local state when user prop changes
  useEffect(() => {
    setAutopilotStatus(user?.autopilot_enabled || false);
  }, [user?.autopilot_enabled]);

  // Function to handle autopilot status changes
  const handleAutopilotStatusChange = (newStatus) => {
    setAutopilotStatus(newStatus);
  };

  // Handle opening the share modal
  const openShareModal = (content) => {
    setSelectedContent(content);
    setIsShareModalOpen(true);
  };

  // Handle closing the share modal
  const closeShareModal = () => {
    setSelectedContent(null);
    setSelectedContacts([]);
    setIsShareModalOpen(false);
  };

  // Handle contact selection
  const handleContactSelection = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const handleShare = async () => {
    if (!selectedContent) return;

    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact to share with.");
      return;
    }

    try {
      let response;

      if (selectedContent.is_guest) {
        // Guest content is disabled but keep the check for safety
        toast.error("Guest content feature is not available.");
        return;
      } else {
        // Share matched content
        response = await shareContent(
          selectedContent.id, // Matched content ID
          selectedContacts, // Contact IDs
        );

        console.log("📦 Share response received:", response.data);

        if (response.data?.unlock_result?.unlocked) {
          const unlockedContent = response.data.unlock_result.content;

          toast.success(`🎉 "${unlockedContent.title}" unlocked!`, {
            duration: 5000,
          });

          // Update the unlocked content in the UI
          if (onContentUpdated) {
            console.log(
              "🔄 Calling onContentUpdated with unlocked content:",
              unlockedContent,
            );
            onContentUpdated(unlockedContent);
          }
        } else {
          // No unlock happened (no pending content or no credits)
          toast.success(
            `✅ Shared with ${selectedContacts.length} contact${selectedContacts.length === 1 ? "" : "s"}!`,
            { duration: 3000 },
          );
        }

        if (response.data?.credits) {
          const msg =
            response.data.credits.available > 0
              ? `💰 ${response.data.credits.available} credit${response.data.credits.available === 1 ? "" : "s"} available`
              : "💡 Share more to earn credits!";

          setTimeout(() => {
            toast.info(msg, { duration: 3000 });
          }, 500);
        }

        // Trigger any additional callbacks
        if (onShare && selectedContent.required_shares) {
          onShare(selectedContent.id, selectedContent.required_shares);
        }
      }

      closeShareModal();
    } catch (err) {
      console.error("❌ Share error:", err);

      if (err.status === 403 || err.message.includes("limit")) {
        if (onOpenPremiumModal) onOpenPremiumModal();
        toast.error("Daily limit reached. Upgrade to Premium!");
      } else {
        toast.error(`Failed to share: ${err.message || "Unknown error"}`);
      }
    }
  };

  const processAutopilotQueue = useCallback(async () => {
    if (!autopilotStatus) return;

    if (!userContents?.length) {
      console.log("🤖 No user content available");
      return;
    }

    if (!selectedMatches?.length) {
      console.log("🤖 No matched content available");
      return;
    }

    if (!contacts?.length) {
      console.log("🤖 No contacts available");
      return;
    }

    const autoShareEnabled = userContents.filter(
      (content) => content.status === "pending" && content.auto_share === true,
    );

    if (autoShareEnabled.length === 0) {
      console.log("🤖 No content with auto_share enabled");
      return;
    }

    const sortedByPriority = autoShareEnabled.sort((a, b) => {
      const aRemaining = (a.required_shares || 5) - (a.share_count || 0);
      const bRemaining = (b.required_shares || 5) - (b.share_count || 0);
      return aRemaining - bRemaining;
    });

    const targetContent = sortedByPriority[0];

    console.log("🤖 AI targeting:", {
      title: targetContent.title,
      progress: `${targetContent.share_count}/${targetContent.required_shares}`,
      remaining:
        (targetContent.required_shares || 5) - (targetContent.share_count || 0),
    });

    const qualityContacts = contacts.filter(
      (c) => (c.quality_score || 50) >= 50,
    );

    if (qualityContacts.length === 0) {
      console.log("🤖 No quality contacts available");
      return;
    }

    try {
      const contentToShare = selectedMatches[0];
      const selectedContactIds = qualityContacts
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((c) => c.id);

      console.log("🤖 Sharing:", contentToShare.title);

      const response = await shareContent(
        contentToShare.id,
        selectedContactIds,
        targetContent.id,
      );

      if (onContentUpdated && response.user_content) {
        onContentUpdated(response.user_content);
      }

      if (response.user_content?.unlocked) {
        toast.success(`🎉 AI unlocked: ${response.user_content.title}!`, {
          duration: 5000,
        });
      } else if (response.user_content) {
        const remaining =
          response.user_content.required_shares -
          response.user_content.share_count;

        if (remaining <= 2 || response.user_content.share_count % 2 === 0) {
          toast.success(
            `🤖 ${response.user_content.title}: ${response.user_content.share_count}/${response.user_content.required_shares} (${remaining} left)`,
            { duration: 3000 },
          );
        }
      }

      console.log("✅ AI share successful");
    } catch (error) {
      console.error("❌ AI error:", error);

      if (error.status === 403 || error.message.includes("limit")) {
        setAutopilotStatus(false);
        if (onStatusChange) onStatusChange(false);
        toast.error("🤖 AI paused: Daily limit reached", { duration: 5000 });
      }
    }
  }, [
    autopilotStatus,
    userContents,
    selectedMatches,
    contacts,
    shareContent,
    onContentUpdated,
  ]);

  useEffect(() => {
    if (!autopilotStatus) return;

    processAutopilotQueue();

    const interval = setInterval(processAutopilotQueue, 30000);

    return () => clearInterval(interval);
  }, [autopilotStatus]);

  const statusBadge = (status) => {
    const statusMap = {
      shared: {
        label: "Shared",
        dotColor: "fill-green-500",
        classes: "bg-green-50 text-green-700",
      },
      pending: {
        label: "Pending",
        dotColor: "fill-yellow-500",
        classes: "bg-yellow-50 text-yellow-800",
      },
      active: {
        label: "Active",
        dotColor: "fill-blue-500",
        classes: "bg-blue-50 text-blue-700",
      },
      inactive: {
        label: "Inactive",
        dotColor: "fill-gray-400",
        classes: "bg-gray-50 text-gray-700",
      },
      error: {
        label: "Error",
        dotColor: "fill-red-500",
        classes: "bg-red-50 text-red-700",
      },
    };

    const statusInfo = statusMap[status] || statusMap.inactive;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg ${statusInfo.classes}`}
      >
        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5">
          <circle r={3} cx={3} cy={3} className={statusInfo.dotColor} />
        </svg>
        {statusInfo.label}
      </span>
    );
  };

  const getContentEmoji = (type) => {
    const emojiMap = {
      article: "📰",
      video: "🎬",
      image: "🖼️",
      pdf: "📄",
      code: "💻",
      audio: "🎵",
      podcast: "🎙️",
      presentation: "📊",
      thread: "🧵",
      link: "🔗",
      note: "📝",
    };
    return emojiMap[type] || "📦";
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col bg-white min-h-0">
        <style>{scrollbarStyles}</style>
        <div className="p-4 flex items-center justify-center">
          <span className="inline-flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-800 ring-2 ring-inset ring-gray-300">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="mb-4 rounded-xl bg-red-50 p-4 border-2 border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-white min-h-0">
      <style>{scrollbarStyles}</style>
      <div className="flex-1 min-h-0 overflow-y-auto share-manage-scrollbar px-0">
        {/* Matched Contents Section */}
        <section className="mb-4 mt-5">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
              Matched Contents ({selectedMatches.length})
            </label>
            <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {selectedMatches.length === 0
                    ? "No matched content available"
                    : "Share to unlock your queue"}
                </span>
                <button
                  type="button"
                  className="text-xs font-bold underline hover:text-black transition-colors"
                  onClick={() => setIsMatchedContentModalOpen(true)}
                  data-tour-id="step11-view-all-matched"
                >
                  View All
                </button>
              </div>

              {selectedMatches.length === 0 ? (
                <div
                  className="p-6 text-center"
                  data-tour-id="step11-empty-share-state"
                >
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    Select content from the discovery panel
                  </div>
                  <div className="text-xs text-gray-500">
                    Your matched content will appear here
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-y-auto share-manage-scrollbar"
                  style={{ maxHeight: 180 }}
                >
                  <div className="space-y-3 p-3">
                    {selectedMatches.map((content) => (
                      <div
                        key={content.id}
                        className="group cursor-pointer rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all bg-white"
                      >
                        <div className="px-3 py-2 border-b-2 border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                <a
                                  href={content.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-black hover:underline"
                                  title={content.title}
                                >
                                  {content.title}
                                </a>
                              </h3>
                              <div className="mt-0.5 text-xs text-gray-500">
                                <time
                                  dateTime={new Date(
                                    content.created_at,
                                  ).toISOString()}
                                >
                                  {new Date(
                                    content.created_at,
                                  ).toLocaleDateString()}
                                </time>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="ml-3 px-4 py-2 text-sm font-bold text-white bg-black border-2 border-black rounded-xl hover:bg-white hover:text-black hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                              onClick={() => openShareModal(content)}
                            >
                              📤 Share
                            </button>
                          </div>
                        </div>

                        <div className="px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {statusBadge(content.status)}
                              <span className="text-sm">
                                {getContentEmoji(content.content_type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        selectedContent={selectedContent}
        selectedContacts={selectedContacts}
        selectedContents={selectedContents}
        userContents={userContents}
        contacts={contacts}
        handleContactSelection={handleContactSelection}
        handleShare={handleShare}
        onOpenPremiumModal={onOpenPremiumModal}
        onOpenContactsModal={onOpenContactsModal}
      />

      {/* Matched Contents Modal */}
      <ContentListModal
        isOpen={isMatchedContentModalOpen}
        onClose={() => setIsMatchedContentModalOpen(false)}
        title="Matched Contents"
        contents={selectedMatches}
      />
    </div>
  );
};

export default ShareAndManage;
