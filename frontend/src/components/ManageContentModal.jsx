// frontend/src/components/ManageContentModal.jsx

import React, {
  useState,
  useEffect,
  Fragment,
  useContext,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";
import DeleteContentModal from "./DeleteContentModal";
import AnalyticsTab from "./AnalyticsTab";
import ContentManagementTab from "./ContentManagementTab";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const scrollbarStyles = `
  .manage-content-scroll::-webkit-scrollbar { width: 10px; }
  .manage-content-scroll::-webkit-scrollbar-thumb { background: #000; border-radius: 6px; }
  .manage-content-scroll::-webkit-scrollbar-track { background: #fff; }
  .manage-content-scroll { scrollbar-width: thin; scrollbar-color: #000 #fff; }
`;

const ManageContentModal = ({
  isOpen,
  onClose,
  selectedContents = [],
  isAITier = false,
}) => {
  const {
    getContentDetails,
    getContentAnalytics,
    editContent,
    deleteContent,
    enhanceLink,
  } = useApi();

  const authContext = useContext(AuthContext);

  // Log the full AuthContext object
  console.log("ManageContentModal - AuthContext Data:", authContext);

  const { isPremium, isAITier: userIsAITier, user: currentUser } = authContext;

  // Log individual values for debugging
  console.log("ManageContentModal - isPremium:", isPremium);
  console.log("ManageContentModal - isAITier:", userIsAITier);
  console.log("ManageContentModal - Current User:", currentUser);
  // Log initial context values for debugging
  console.log("ManageContentModal - Initial Context Data:", {
    isPremium,
    userIsAITier,
    currentUser,
  });

  const [contentDetails, setContentDetails] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [errorAnalytics, setErrorAnalytics] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Log when the modal opens
      console.log("ManageContentModal Opened - AI Tier Status:", {
        isPremium,
        userIsAITier,
        currentUser,
      });
    }

    if (isOpen && selectedContents.length > 0) {
      setLoadingDetails(true);
      Promise.all(selectedContents.map((c) => getContentDetails(c.id)))
        .then((details) => {
          console.log("Fetched Content Details:", details); // Log fetched details
          setContentDetails(details);
        })
        .catch((error) => {
          console.error("Error fetching content details:", error);
          setErrorDetails("Failed to fetch content details.");
          toast.error("Failed to fetch content details.");
        })
        .finally(() => setLoadingDetails(false));

      setLoadingAnalytics(true);
      const ids = selectedContents.map((c) => c.id);
      getContentAnalytics(ids)
        .then((analytics) => {
          console.log("Fetched Analytics Data:", analytics); // Log analytics data
          setAnalyticsData(analytics);
        })
        .catch((error) => {
          console.error("Error fetching analytics data:", error);
          setErrorAnalytics("Failed to fetch analytics data.");
          toast.error("Failed to fetch analytics data.");
        })
        .finally(() => setLoadingAnalytics(false));
    } else {
      setContentDetails([]);
      setAnalyticsData({});
    }
  }, [
    isOpen,
    selectedContents,
    getContentDetails,
    getContentAnalytics,
    isPremium,
    userIsAITier,
    currentUser,
  ]);

  const mergedContentData = useMemo(() => {
    if (contentDetails.length && Object.keys(analyticsData).length) {
      return contentDetails.map((c) => ({
        ...c,
        share_count: analyticsData[c.id]?.shares || 0,
        required_shares: c.required_shares || 5,
        short_link_clicks: analyticsData[c.id]?.short_link_clicks || 0,
      }));
    }
    return [];
  }, [contentDetails, analyticsData]);

  const handleEdit = (id) => {
    const c = contentDetails.find((x) => x.id === id);
    if (!c) return toast.error("Content not found.");
    setCurrentContent(c);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (content) => {
    setContentToDelete(content);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contentToDelete) return;
    try {
      await deleteContent(contentToDelete.id);
      setContentDetails((prev) =>
        prev.filter((c) => c.id !== contentToDelete.id),
      );
      toast.success("Deleted successfully!");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setIsDeleteModalOpen(false);
      setContentToDelete(null);
    }
  };

  const saveEdit = async (id, updatedFields) => {
    try {
      const updated = await editContent(id, updatedFields);
      setContentDetails((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success("Updated successfully!");
    } catch {
      toast.error("Failed to update.");
    }
  };

  // Add this debug code right here, before the return statement
  console.log("Final values passed to ContentManagementTab:", {
    isPremium,
    isAITier: userIsAITier,
    user: currentUser,
  });

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
          <style>{scrollbarStyles}</style>

          {/* Backdrop */}
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

          {/* Container */}
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
                <Dialog.Panel className="relative w-full max-w-screen-2xl transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                    <Dialog.Title className="text-lg font-bold uppercase">
                      Content Management
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 rounded border border-black hover:bg-black hover:text-white transition"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <Tab.Group>
                      <Tab.List className="flex gap-2">
                        {["Content Management", "Analytics"].map((label) => (
                          <Tab
                            key={label}
                            className={({ selected }) =>
                              classNames(
                                "px-4 py-2 text-sm font-medium rounded border transition",
                                selected
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                              )
                            }
                          >
                            {label}
                          </Tab>
                        ))}
                      </Tab.List>

                      <Tab.Panels className="mt-4">
                        {/* Content Management Tab */}
                        <Tab.Panel>
                          {loadingDetails ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                              Loading content details...
                            </div>
                          ) : errorDetails ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                              {errorDetails}
                            </div>
                          ) : (
                            <div className="overflow-auto manage-content-scroll max-h-[500px]">
                              <ContentManagementTab
                                contentDetails={contentDetails}
                                handleEdit={handleEdit}
                                handleDeleteClick={handleDeleteClick}
                                enhanceLink={enhanceLink}
                                getContentDetails={getContentDetails}
                                setContentDetails={setContentDetails}
                                isPremium={isPremium}
                                isAITier={userIsAITier}
                              />
                            </div>
                          )}
                        </Tab.Panel>

                        {/* Analytics Tab */}
                        <Tab.Panel>
                          {loadingAnalytics ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                              Loading analytics data...
                            </div>
                          ) : errorAnalytics ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                              {errorAnalytics}
                            </div>
                          ) : mergedContentData.length === 0 ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                              No analytics data available.
                            </div>
                          ) : (
                            <AnalyticsTab
                              analyticsData={mergedContentData}
                              isPremium={isPremium || userIsAITier}
                            />
                          )}
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {selectedContents.length} content item
                        {selectedContents.length === 1 ? "" : "s"} selected
                      </span>
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

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <DeleteContentModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          contentTitle={contentToDelete?.title}
        />
      )}

      {/* Edit Modal */}
      {currentContent && (
        <EditContentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentContent(null);
          }}
          content={currentContent}
          onSave={saveEdit}
        />
      )}
    </>
  );
};

ManageContentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedContents: PropTypes.array,
  isAITier: PropTypes.bool,
};

export default ManageContentModal;
