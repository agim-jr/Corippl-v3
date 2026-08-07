import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";

const scrollbarStyles = `
  .out-of-shuffles-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .out-of-shuffles-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .out-of-shuffles-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .out-of-shuffles-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }
`;

const OutOfShufflesModal = ({
  isOpen,
  onClose,
  onGuestContentShare,
  onUpgradeToPremium,
}) => {
  const {
    getMatchedContent,
    shareGuestContent,
    fetchContacts,
    getRemainingShuffles,
  } = useApi();
  const [guestContent, setGuestContent] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showContactSelection, setShowContactSelection] = useState(false);

  // ✅ NEW: Track shuffle state
  const [currentShuffles, setCurrentShuffles] = useState({
    regular: 0,
    bonus: 0,
    total: 0,
  });

  useEffect(() => {
    if (isOpen) {
      fetchGuestContent();
      loadContacts();
      loadShuffleData(); // ✅ NEW: Load shuffle data when modal opens
    }
  }, [isOpen]);

  const fetchGuestContent = async () => {
    setLoading(true);
    try {
      const allContent = await getMatchedContent(false, false);
      const guestOnly = allContent.filter(
        (content) => content.is_guest === true
      );
      setGuestContent(guestOnly);

      if (guestOnly.length === 0) {
        toast.info(
          "No guest content available at the moment. Check back soon!"
        );
      }
    } catch (error) {
      console.error("❌ Error fetching guest content:", error);
      toast.error("Failed to load guest content");
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const fetchedContacts = await fetchContacts();
      setContacts(fetchedContacts);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      toast.error("Failed to fetch contacts.");
    }
  };

  // ✅ NEW: Function to load shuffle data
  const loadShuffleData = async () => {
    try {
      const data = await getRemainingShuffles();
      console.log("🔍 Shuffle data loaded:", data);

      setCurrentShuffles({
        regular:
          data.remaining_shuffles === "Unlimited"
            ? -1
            : data.remaining_shuffles || 0,
        bonus: data.bonus_shuffles || 0,
        total:
          data.remaining_shuffles === "Unlimited"
            ? -1
            : (data.remaining_shuffles || 0) + (data.bonus_shuffles || 0),
      });
    } catch (error) {
      console.error("Error loading shuffle data:", error);
    }
  };

  const handleSelectContent = (content) => {
    setSelectedContent(content);
    setShowContactSelection(true);
    setSelectedContacts([]);
  };

  const handleContactSelection = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleShare = async () => {
    if (!selectedContent) {
      toast.error("Please select content to share");
      return;
    }

    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    try {
      console.log("🔥 Sharing guest content:", selectedContent.id);
      console.log("🔥 With contacts:", selectedContacts);

      const response = await shareGuestContent(
        selectedContent.id,
        selectedContacts
      );

      console.log("🔥 Share response:", response);

      // ✅ UPDATE SHUFFLE STATE IMMEDIATELY
      const oldBonus = currentShuffles.bonus;
      const newBonus = response.total_bonus_shuffles || 0;
      const shufflesEarned = newBonus - oldBonus;

      setCurrentShuffles({
        regular: currentShuffles.regular,
        bonus: newBonus,
        total: currentShuffles.regular + newBonus,
      });

      // Show success message
      if (response.bonus_shuffles_awarded > 0) {
        toast.success(
          `🎉 Shared with ${selectedContacts.length} people! +${response.bonus_shuffles_awarded} bonus shuffles earned! You now have ${newBonus} bonus shuffles!`,
          { autoClose: 6000, position: "top-center" }
        );
      } else {
        toast.info(
          `✅ Shared with ${selectedContacts.length} people! (Premium users have unlimited shuffles)`,
          { autoClose: 3000 }
        );
      }

      // Notify parent to refresh shuffle display
      if (onGuestContentShare) {
        onGuestContentShare({
          ...selectedContent,
          shufflesEarned: response.bonus_shuffles_awarded,
          newBonusTotal: newBonus,
        });
      }

      // Remove from available content
      setGuestContent((prev) =>
        prev.filter((content) => content.id !== selectedContent.id)
      );

      // Reset selection
      setSelectedContent(null);
      setSelectedContacts([]);
      setShowContactSelection(false);

      // ✅ RELOAD shuffle data to be 100% sure
      await loadShuffleData();

      // Close modal after showing success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("❌ Share failed:", error);
      toast.error(
        error.response?.data?.detail || error.message || "Share failed"
      );
    }
  };

  const handleBackToSelection = () => {
    setShowContactSelection(false);
    setSelectedContent(null);
    setSelectedContacts([]);
  };

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
                    {showContactSelection
                      ? "Select Recipients"
                      : "Out of Shuffles"}
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
                <div className="px-6 py-6 space-y-4 max-h-[65vh] overflow-y-auto out-of-shuffles-scroll">
                  {!showContactSelection ? (
                    <>
                      {/* Status Message */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Status
                        </label>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm leading-relaxed">
                          <div className="flex items-center">
                            <InformationCircleIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-600" />
                            <span>
                              You've run out of shuffles. Choose an option below
                              to continue discovering content.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Choose Your Option
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-white border border-gray-300 rounded hover:border-black transition-colors">
                            <div className="text-center mb-3">
                              <div className="text-3xl mb-2">⭐</div>
                              <h4 className="text-sm font-bold text-gray-900 mb-1">
                                Share Guest Content
                              </h4>
                              <p className="text-xs text-gray-600">
                                +2 bonus shuffles per share
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-start gap-2 text-xs">
                                <span className="text-green-600 flex-shrink-0">
                                  ✓
                                </span>
                                <span className="text-gray-700">
                                  Free and instant
                                </span>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="text-green-600 flex-shrink-0">
                                  ✓
                                </span>
                                <span className="text-gray-700">
                                  Help new creators
                                </span>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="text-green-600 flex-shrink-0">
                                  ✓
                                </span>
                                <span className="text-gray-700">
                                  Earn as you share
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-gray-300 rounded hover:border-black transition-colors">
                            <div className="text-center mb-3">
                              <div className="text-3xl mb-2">♾️</div>
                              <h4 className="text-sm font-bold text-gray-900 mb-1">
                                Upgrade to Premium
                              </h4>
                              <p className="text-xs text-gray-600">
                                Unlimited shuffles forever
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-start gap-2 text-xs">
                                <span className="text-green-600 flex-shrink-0">
                                  ✓
                                </span>
                                <span className="text-gray-700">
                                  Never run out
                                </span>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="text-green-600 flex-shrink-0">
                                  ✓
                                </span>
                                <span className="text-gray-700">
                                  Advanced features
                                </span>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="text-green-600 flex-shrink-0">
                                  ✓
                                </span>
                                <span className="text-gray-700">
                                  Priority support
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guest Content List */}
                      {loading ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-center text-gray-500">
                          Loading guest content...
                        </div>
                      ) : guestContent.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm">
                          <p className="text-gray-600 mb-3 text-center">
                            No guest content available. Check back soon or
                            upgrade to Premium.
                          </p>
                          <button
                            onClick={onUpgradeToPremium}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition"
                          >
                            Upgrade to Premium
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                            Available Guest Content ({guestContent.length})
                          </label>
                          <div className="space-y-3">
                            {guestContent.map((content) => (
                              <div
                                key={content.id}
                                className="p-3 bg-white border border-gray-300 rounded hover:border-black transition-all cursor-pointer"
                                onClick={() => handleSelectContent(content)}
                              >
                                <div className="mb-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded">
                                    ⭐ GUEST
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">
                                  {content.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2">
                                  By{" "}
                                  {content.guest_creator_name ||
                                    "Guest Creator"}
                                </p>
                                {content.description && (
                                  <p className="text-xs text-gray-500 mb-3">
                                    {content.description}
                                  </p>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectContent(content);
                                  }}
                                  className="w-full px-3 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition"
                                >
                                  Select & Share for +2 Shuffles
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Premium CTA */}
                      {guestContent.length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={onUpgradeToPremium}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition"
                          >
                            Or Upgrade to Premium for Unlimited Shuffles
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Selected Content Info */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Selected Content
                        </label>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">⭐</div>
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-purple-900 mb-1">
                                {selectedContent?.title}
                              </h3>
                              <p className="text-xs text-purple-700">
                                By{" "}
                                {selectedContent?.guest_creator_name ||
                                  "Guest Creator"}
                              </p>
                              {selectedContent?.description && (
                                <p className="text-xs text-purple-600 mt-2">
                                  {selectedContent.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold uppercase text-gray-600">
                            Select Recipients
                          </label>
                          {contacts.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {selectedContacts.length} of {contacts.length}{" "}
                              selected
                            </span>
                          )}
                        </div>
                        {contacts.length === 0 ? (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-center text-gray-600">
                            No contacts available
                          </div>
                        ) : (
                          <div className="border border-gray-300 rounded overflow-hidden">
                            <div className="max-h-64 overflow-y-auto bg-white out-of-shuffles-scroll">
                              <ul className="divide-y divide-gray-200">
                                {contacts.map((contact) => (
                                  <li
                                    key={contact.id}
                                    className="p-3 hover:bg-gray-50 transition"
                                  >
                                    <label
                                      htmlFor={`contact-${contact.id}`}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`contact-${contact.id}`}
                                        checked={selectedContacts.includes(
                                          contact.id
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
                          </div>
                        )}
                      </div>

                      {/* Submit Actions */}
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        <button
                          onClick={handleShare}
                          disabled={selectedContacts.length === 0}
                          className={`w-full px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition ${
                            selectedContacts.length === 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {selectedContacts.length === 0
                            ? "Select at least one contact"
                            : `Share with ${selectedContacts.length} contact${
                                selectedContacts.length === 1 ? "" : "s"
                              } (+2 Shuffles)`}
                        </button>

                        <button
                          onClick={handleBackToSelection}
                          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                        >
                          ← Back to Content Selection
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Click outside or press ESC to close
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

export default OutOfShufflesModal;
