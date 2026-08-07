// frontend/src/pages/AdminReport.jsx

"use client";

import React, { useEffect, useState, useContext, useMemo } from "react";
import { useApi } from "../lib/api";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import ConfirmationModal from "../components/ConfirmationModal";

// Custom scrollbar styles matching List2
const scrollbarStyles = `
  .admin-report-scrollbar::-webkit-scrollbar {
    width: 10px;
  }
  .admin-report-scrollbar::-webkit-scrollbar-thumb {
    background: #222;
    border-radius: 6px;
  }
  .admin-report-scrollbar::-webkit-scrollbar-track {
    background: #f3f3f3;
  }
  .admin-report-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #222 #f3f3f3;
  }
`;

// Badge helpers matching List2 style
function statusBadge(status) {
  const statusMap = {
    flagged: {
      label: "Flagged",
      emoji: "⚠️",
      classes: "bg-yellow-50 text-yellow-800",
      dotClasses: "fill-yellow-500",
    },
    under_review: {
      label: "Under Review",
      emoji: "👀",
      classes: "bg-blue-50 text-blue-700",
      dotClasses: "fill-blue-500",
    },
    approved: {
      label: "Approved",
      emoji: "✅",
      classes: "bg-green-50 text-green-700",
      dotClasses: "fill-green-500",
    },
    deleted: {
      label: "Deleted",
      emoji: "🗑️",
      classes: "bg-red-50 text-red-700",
      dotClasses: "fill-red-500",
    },
    pending: {
      label: "Pending",
      emoji: "⏳",
      classes: "bg-gray-50 text-gray-700",
      dotClasses: "fill-gray-400",
    },
  };
  const s = (status || "").toLowerCase();
  const { label, emoji, classes, dotClasses } = statusMap[s] || {
    label: status,
    emoji: "📦",
    classes: "bg-gray-50 text-gray-700",
    dotClasses: "fill-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${classes}`}
    >
      <svg
        viewBox="0 0 6 6"
        aria-hidden="true"
        className={`size-1.5 ${dotClasses}`}
      >
        <circle r={3} cx={3} cy={3} />
      </svg>
      <span className="mr-1">{emoji}</span>
      {label}
    </span>
  );
}

function contentTypeBadge(type) {
  const typeMap = {
    article: {
      label: "Article",
      emoji: "📰",
      classes: "bg-blue-50 text-blue-700",
    },
    video: { label: "Video", emoji: "🎬", classes: "bg-red-50 text-red-700" },
    image: {
      label: "Image",
      emoji: "🖼️",
      classes: "bg-yellow-50 text-yellow-800",
    },
    pdf: { label: "PDF", emoji: "📄", classes: "bg-green-50 text-green-700" },
    code: {
      label: "Code",
      emoji: "💻",
      classes: "bg-indigo-50 text-indigo-700",
    },
    audio: {
      label: "Audio",
      emoji: "🎵",
      classes: "bg-purple-50 text-purple-700",
    },
    podcast: {
      label: "Podcast",
      emoji: "🎙️",
      classes: "bg-pink-50 text-pink-700",
    },
    presentation: {
      label: "Presentation",
      emoji: "📊",
      classes: "bg-orange-50 text-orange-700",
    },
    thread: {
      label: "Thread",
      emoji: "🧵",
      classes: "bg-teal-50 text-teal-700",
    },
    link: { label: "Link", emoji: "🔗", classes: "bg-gray-50 text-gray-700" },
    note: { label: "Note", emoji: "📝", classes: "bg-lime-50 text-lime-700" },
    default: { label: type, emoji: "📦", classes: "bg-gray-100 text-gray-600" },
  };
  const t = (type || "").toLowerCase();
  const { label, emoji, classes } = typeMap[t] || typeMap.default;
  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${classes}`}
    >
      <span className="mr-1">{emoji}</span>
      {label}
    </span>
  );
}

function categoryBadge(cat) {
  return (
    <span
      key={cat}
      className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-gray-50 text-gray-700"
    >
      {cat}
    </span>
  );
}

const AdminReport = () => {
  const { getFlags, deleteFlag, updateContentStatus, adminDeleteContent } =
    useApi();
  const { isAdmin } = useContext(AuthContext);

  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [selectedFlagId, setSelectedFlagId] = useState(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState(null);

  // Selection state
  const [selectedFlags, setSelectedFlags] = useState([]);

  // Local status updates for optimistic UI
  const [localStatusUpdates, setLocalStatusUpdates] = useState({});

  // Function to get current status (local override or original)
  const getCurrentStatus = (flag) => {
    return localStatusUpdates[flag.id] || flag.content.status;
  };

  // Filtered and sorted flags
  const filteredFlags = useMemo(() => {
    let filtered = flags;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (flag) => getCurrentStatus(flag) === statusFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (flag) =>
          flag.content.title.toLowerCase().includes(search) ||
          flag.reason.toLowerCase().includes(search) ||
          flag.user.username.toLowerCase().includes(search)
      );
    }

    // Sort flags
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "content_title":
          return a.content.title.localeCompare(b.content.title);
        case "user":
          return a.user.username.localeCompare(b.user.username);
        default:
          return 0;
      }
    });

    return filtered;
  }, [flags, statusFilter, sortBy, searchTerm, localStatusUpdates]);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admins only.");
      setLoading(false);
      return;
    }
    const fetchFlags = async () => {
      try {
        const data = await getFlags();
        setFlags(data);
      } catch (err) {
        setError(err.message || "Failed to fetch flags.");
        toast.error("Failed to fetch flags.");
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, [getFlags, isAdmin]);

  const handleSelect = (flag) => {
    setSelectedFlags((prevSelected) => {
      if (prevSelected.find((item) => item.id === flag.id)) {
        return prevSelected.filter((item) => item.id !== flag.id);
      } else {
        return [...prevSelected, flag];
      }
    });
  };

  const handleStatusChange = async (flag, newStatus) => {
    const flagId = flag.id;

    // Optimistically update local status
    setLocalStatusUpdates((prev) => ({
      ...prev,
      [flagId]: newStatus,
    }));

    try {
      const updatedContent = await updateContentStatus(flagId, newStatus);
      setFlags(
        flags.map((f) =>
          f.id === flagId ? { ...f, content: updatedContent } : f
        )
      );

      // Clear local status since we have server response
      setLocalStatusUpdates((prev) => {
        const newState = { ...prev };
        delete newState[flagId];
        return newState;
      });

      toast.success(`Content status updated to "${newStatus}".`);
    } catch (err) {
      // Revert optimistic update on error
      setLocalStatusUpdates((prev) => {
        const newState = { ...prev };
        delete newState[flagId];
        return newState;
      });

      toast.error(`Failed to update content status: ${err.message}`);
    }
  };

  const handleOpenFlagModal = (flagId) => {
    setSelectedFlagId(flagId);
    setIsFlagModalOpen(true);
  };

  const handleCloseFlagModal = () => {
    setIsFlagModalOpen(false);
    setSelectedFlagId(null);
  };

  const handleConfirmDeleteFlag = async () => {
    if (!selectedFlagId) return;
    try {
      await deleteFlag(selectedFlagId);
      setFlags(flags.filter((flag) => flag.id !== selectedFlagId));
      toast.success(`Flag deleted successfully.`);
    } catch (err) {
      toast.error(`Failed to delete flag: ${err.message}`);
    } finally {
      setSelectedFlagId(null);
      setIsFlagModalOpen(false);
    }
  };

  const handleOpenContentModal = (contentId) => {
    setSelectedContentId(contentId);
    setIsContentModalOpen(true);
  };

  const handleCloseContentModal = () => {
    setIsContentModalOpen(false);
    setSelectedContentId(null);
  };

  const handleConfirmDeleteContent = async () => {
    if (!selectedContentId) return;
    try {
      await adminDeleteContent(selectedContentId);
      setFlags(flags.filter((flag) => flag.content_id !== selectedContentId));
      toast.success(`Content deleted successfully.`);
    } catch (err) {
      toast.error(`Failed to delete content: ${err.message}`);
    } finally {
      setSelectedContentId(null);
      setIsContentModalOpen(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: flags.length,
    flagged: flags.filter((f) => getCurrentStatus(f) === "flagged").length,
    under_review: flags.filter((f) => getCurrentStatus(f) === "under_review")
      .length,
    approved: flags.filter((f) => getCurrentStatus(f) === "approved").length,
    deleted: flags.filter((f) => getCurrentStatus(f) === "deleted").length,
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] font-mono">
        <div className="p-6 bg-red-50 border border-red-600 rounded-2xl text-red-900 text-lg font-bold">
          Access Denied.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] font-mono">
        <div className="text-black text-lg font-bold animate-pulse">
          Loading flagged content…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] font-mono">
        <div className="p-6 bg-red-50 border border-red-600 rounded-2xl text-red-900 text-lg font-bold">
          <pre>{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 font-mono">
      <style>{scrollbarStyles}</style>

      <h1 className="text-3xl font-bold mb-8 text-black flex items-center gap-3 font-mono">
        <span className="inline-flex items-center gap-x-1.5 rounded-md px-3 py-1 text-xl font-medium bg-yellow-50 text-yellow-800">
          <span className="text-2xl">⚠️</span>
          Admin Report
        </span>
      </h1>

      {/* Enhanced Filters and Stats */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
            <div className="text-xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-600 font-mono">Total Flags</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
            <div className="text-xl font-bold text-yellow-800">
              {stats.flagged}
            </div>
            <div className="text-xs text-yellow-600 font-mono">Flagged</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
            <div className="text-xl font-bold text-blue-800">
              {stats.under_review}
            </div>
            <div className="text-xs text-blue-600 font-mono">Under Review</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
            <div className="text-xl font-bold text-green-800">
              {stats.approved}
            </div>
            <div className="text-xs text-green-600 font-mono">Approved</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
            <div className="text-xl font-bold text-red-800">
              {stats.deleted}
            </div>
            <div className="text-xs text-red-600 font-mono">Deleted</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">
              Search
            </label>
            <input
              type="text"
              placeholder="Search content, reason, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 font-mono">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All Statuses</option>
              <option value="flagged">Flagged</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 font-mono">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="content_title">Content Title</option>
              <option value="user">Username</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 font-mono">
          Showing {filteredFlags.length} of {flags.length} flags
        </div>
      </div>

      {filteredFlags.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg py-16 text-center text-gray-500 shadow-sm font-mono text-lg">
          <span>No flagged content matches your filters.</span>
        </div>
      ) : (
        <div className="mt-6 font-mono">
          <ul
            role="list"
            className="admin-report-scrollbar overflow-y-auto max-h-[70vh] space-y-3"
          >
            {filteredFlags.map((flag) => {
              const isSelected = selectedFlags.some(
                (item) => item.id === flag.id
              );
              const currentStatus = getCurrentStatus(flag);

              return (
                <li
                  key={flag.id}
                  className={`group flex flex-col lg:flex-row lg:items-center justify-between
                        px-4 py-3 cursor-pointer rounded-lg border transition
                        ${
                          isSelected
                            ? "bg-gray-50 border-gray-300 shadow-sm"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                  onClick={() => handleSelect(flag)}
                  tabIndex={0}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex-1 min-w-0">
                    {/* Content Title and Type */}
                    <div className="flex items-start gap-x-3 min-w-0 mb-2">
                      <a
                        href={flag.content.url}
                        className="text-sm font-semibold text-gray-900 group-hover:text-black hover:underline truncate flex-1"
                        title={flag.content.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {flag.content.title}
                      </a>
                      {contentTypeBadge(flag.content.content_type)}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-x-2 text-xs text-gray-500 mb-2 flex-wrap">
                      <span className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-gray-50 text-gray-700">
                        <svg
                          viewBox="0 0 16 16"
                          className="w-3.5 h-3.5 text-gray-400"
                          fill="none"
                        >
                          <circle
                            cx="8"
                            cy="8"
                            r="7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle cx="8" cy="6" r="2" fill="currentColor" />
                        </svg>
                        {flag.user.username}
                      </span>
                      <svg
                        viewBox="0 0 2 2"
                        className="h-0.5 w-0.5 fill-current flex-shrink-0"
                      >
                        <circle r={1} cx={1} cy={1} />
                      </svg>
                      <span className="truncate">Flag ID: {flag.id}</span>
                      <svg
                        viewBox="0 0 2 2"
                        className="h-0.5 w-0.5 fill-current flex-shrink-0"
                      >
                        <circle r={1} cx={1} cy={1} />
                      </svg>
                      <span className="truncate">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Flag Reason */}
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 font-medium">
                        Reason:{" "}
                      </span>
                      <span className="text-xs text-gray-800">
                        {flag.reason}
                      </span>
                    </div>

                    {/* Status and Categories */}
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      {statusBadge(currentStatus)}

                      {flag.content.categories?.slice(0, 2).map(categoryBadge)}
                      {flag.content.categories?.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{flag.content.categories.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="mt-3 lg:mt-0 lg:ml-4 flex flex-col gap-2 lg:w-64">
                    {/* Status Selector */}
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(flag, e.target.value);
                      }}
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs font-medium font-mono focus:ring-2 focus:ring-black focus:border-black transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="flagged">Flagged</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="deleted">Deleted</option>
                    </select>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFlagModal(flag.id);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 hover:bg-red-50 transition"
                      >
                        Delete Flag
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenContentModal(flag.content_id);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-white bg-red-600 border border-red-600 hover:bg-red-700 transition"
                      >
                        Delete Content
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Confirmation Modal for Flag Deletion */}
      <ConfirmationModal
        isOpen={isFlagModalOpen}
        onClose={handleCloseFlagModal}
        title="Delete Flag"
        description="Are you sure you want to delete this flag? This action cannot be undone."
        confirmText="Delete Flag"
        onConfirm={handleConfirmDeleteFlag}
      />

      {/* Confirmation Modal for Content Deletion */}
      <ConfirmationModal
        isOpen={isContentModalOpen}
        onClose={handleCloseContentModal}
        title="Delete Content"
        description="Are you sure you want to delete this content? This action cannot be undone and all associated flags will be removed."
        confirmText="Delete Content"
        onConfirm={handleConfirmDeleteContent}
      />
    </div>
  );
};

export default AdminReport;
