"use client";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";

const scrollbarStyles = `
  .list2-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .list2-scrollbar::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 4px;
  }
  .list2-scrollbar::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  .list2-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #000 #f5f5f5;
  }
`;

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
    newsletter: {
      label: "Newsletter",
      emoji: "✉️",
      classes: "bg-sky-50 text-sky-700",
    },
    blog: { label: "Blog", emoji: "✍️", classes: "bg-rose-50 text-rose-700" },
    technology: {
      label: "Tech",
      emoji: "🛠️",
      classes: "bg-cyan-50 text-cyan-700",
    },
    art: {
      label: "Art",
      emoji: "🎨",
      classes: "bg-fuchsia-50 text-fuchsia-700",
    },
    health: {
      label: "Health",
      emoji: "🩺",
      classes: "bg-emerald-50 text-emerald-700",
    },
    science: {
      label: "Science",
      emoji: "🔬",
      classes: "bg-violet-50 text-violet-700",
    },
    default: { label: type, emoji: "📦", classes: "bg-gray-100 text-gray-600" },
  };

  const t = (type || "").toLowerCase();
  const { label, emoji, classes } = typeMap[t] || typeMap.default;

  return (
    <span
      className={`inline-flex items-center gap-x-1 rounded-lg px-2 py-1 text-xs font-medium ${classes}`}
    >
      <span>{emoji}</span>
      {label}
    </span>
  );
}

function statusBadge(status) {
  const statusMap = {
    shared: {
      label: "Shared",
      classes: "bg-green-50 text-green-700",
      dot: "fill-green-500",
    },
    pending: {
      label: "Pending",
      classes: "bg-yellow-50 text-yellow-800",
      dot: "fill-yellow-500",
    },
    active: {
      label: "Active",
      classes: "bg-blue-50 text-blue-700",
      dot: "fill-blue-500",
    },
    available: {
      label: "Available",
      classes: "bg-cyan-50 text-cyan-700",
      dot: "fill-cyan-500",
    },
    inactive: {
      label: "Inactive",
      classes: "bg-gray-50 text-gray-700",
      dot: "fill-gray-400",
    },
    error: {
      label: "Error",
      classes: "bg-red-50 text-red-700",
      dot: "fill-red-500",
    },
  };

  const normalizedStatus = (status || "inactive").toLowerCase().trim();
  const statusInfo = statusMap[normalizedStatus] || statusMap.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg ${statusInfo.classes}`}
      data-status={normalizedStatus}
    >
      <svg viewBox="0 0 6 6" className="w-1.5 h-1.5">
        <circle r={3} cx={3} cy={3} className={statusInfo.dot} />
      </svg>
      {statusInfo.label}
    </span>
  );
}

const StatusLegend = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl mb-4 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            📋 How the 1-for-1 System Works
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
        <div className="px-4 pb-4 space-y-3 border-t-2 border-gray-200 pt-3">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
            <strong>⚡ Simple:</strong> Share 1 matched content → Unlock 1 of
            your pending items immediately (in order).
          </div>

          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></span>
            <div className="text-sm">
              <strong className="text-gray-900">Pending (🔒):</strong>
              <span className="text-gray-600">
                {" "}
                Waiting in queue. Share to unlock in FIFO order.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500 mt-1.5"></span>
            <div className="text-sm">
              <strong className="text-gray-900">Available (✅):</strong>
              <span className="text-gray-600">
                {" "}
                Unlocked! Click "Activate" to go live.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5"></span>
            <div className="text-sm">
              <strong className="text-gray-900">Active (🌐):</strong>
              <span className="text-gray-600">
                {" "}
                Live and being shared by the network.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-400 mt-1.5"></span>
            <div className="text-sm">
              <strong className="text-gray-900">Inactive (⏸️):</strong>
              <span className="text-gray-600">
                {" "}
                Paused. Reactivate anytime.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ListItem = ({
  content,
  isSelected,
  onSelect,
  onStatusChange,
  getCurrentStatus,
  queueStatus,
}) => {
  const currentStatus = getCurrentStatus(content);
  const isPending = currentStatus === "pending";
  const isAvailable = currentStatus === "available";

  const queuePosition = queueStatus?.queue_items?.findIndex(
    (item) => item.content_id === content.id,
  );
  const isNextInQueue = queuePosition === 0;

  return (
    <div
      className={`group cursor-pointer rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? "bg-gray-50 border-black shadow-lg"
          : "bg-white border-gray-200 hover:border-gray-400 hover:shadow-md"
      }`}
      onClick={() => onSelect(content)}
      tabIndex={0}
      role="option"
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onSelect(content);
        }
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                isSelected
                  ? "bg-black border-black"
                  : "border-gray-300 group-hover:border-gray-500"
              }`}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={`text-base font-semibold mb-1 ${isSelected ? "text-black" : "text-gray-900"}`}
              >
                <a
                  href={content.url}
                  className="hover:text-black hover:underline"
                  title={content.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {content.title}
                </a>
              </h3>
              <div className="text-xs text-gray-500">
                <time dateTime={new Date(content.created_at).toISOString()}>
                  Submitted {new Date(content.created_at).toLocaleDateString()}
                </time>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            {currentStatus === "available" && (
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-bold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(content, "active");
                }}
              >
                Activate
              </button>
            )}

            {currentStatus === "pending" && (
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-bold text-gray-400 bg-gray-100 border-2 border-gray-300 rounded-lg cursor-not-allowed"
                disabled
                title="Share matched content to unlock this item first"
              >
                🔒 Locked
              </button>
            )}

            {currentStatus === "inactive" && (
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-bold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(content, "active");
                }}
              >
                Reactivate
              </button>
            )}

            {currentStatus === "active" && (
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(content, "inactive");
                }}
              >
                Deactivate
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          {statusBadge(currentStatus)}
          {contentTypeBadge(content.content_type)}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg ${
              isSelected
                ? "text-gray-800 bg-gray-200"
                : "text-gray-700 bg-gray-100"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.5 3a3.5 3.5 0 0 0-3.456 4.06L8.143 9.704a3.5 3.5 0 1 0-.01 4.6l5.91 2.65a3.5 3.5 0 1 0 .863-1.805l-5.94-2.662a3.53 3.53 0 0 0 .002-.961l5.948-2.667A3.5 3.5 0 1 0 17.5 3Z" />
            </svg>
            {Number(content.share_count || 0).toLocaleString()}
          </span>
        </div>

        {isPending && (
          <div
            className={`p-3 rounded-xl border-2 ${
              isNextInQueue
                ? "bg-yellow-50 border-yellow-300"
                : "bg-amber-50 border-amber-300"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{isNextInQueue ? "🔒" : "⏳"}</span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-bold mb-1 ${
                    isNextInQueue ? "text-yellow-900" : "text-amber-900"
                  }`}
                >
                  {isNextInQueue
                    ? "⚡ Next to Unlock"
                    : `📋 Queue Position #${queuePosition + 1}`}
                </div>
                <div
                  className={`text-sm leading-relaxed ${
                    isNextInQueue ? "text-yellow-800" : "text-amber-800"
                  }`}
                >
                  {isNextInQueue ? (
                    <>
                      <strong>Share 1 matched content</strong> to unlock this
                      item immediately.
                    </>
                  ) : queuePosition !== undefined && queuePosition >= 0 ? (
                    <>
                      <strong>{queuePosition}</strong> item
                      {queuePosition === 1 ? "" : "s"} ahead in queue. Share{" "}
                      <strong>{queuePosition + 1}</strong> time
                      {queuePosition + 1 === 1 ? "" : "s"} total to unlock this.
                    </>
                  ) : (
                    <>Share matched content to unlock this item.</>
                  )}
                </div>

                {!isNextInQueue &&
                  queuePosition !== undefined &&
                  queuePosition > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs text-amber-700">
                        <div className="flex-1 bg-amber-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(10, (1 / (queuePosition + 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold whitespace-nowrap">
                          {queuePosition} to go
                        </span>
                      </div>
                    </div>
                  )}

                {isNextInQueue && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-yellow-700 font-bold animate-pulse">
                    <span>⚡</span>
                    <span>One share away from unlocking!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isAvailable && (
          <div className="p-3 bg-green-50 border-2 border-green-300 rounded-xl">
            <div className="flex items-start gap-2">
              <span className="text-xl">✅</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-green-900 mb-1">
                  Ready to Activate
                </div>
                <div className="text-sm text-green-800 leading-relaxed">
                  This content is unlocked! Click <strong>Activate</strong> to
                  make it visible to the network.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const List2 = ({
  contents,
  onContentUpdated,
  onContentDeleted,
  onItemClick,
  selectedContents,
  setSelectedContents,
  queueStatus,
}) => {
  const { shareContent, editContent, deleteContent } = useApi();
  const [refreshKey, setRefreshKey] = useState(0);
  const [localStatusUpdates, setLocalStatusUpdates] = useState({});

  const getCurrentStatus = (content) => {
    const localStatus = localStatusUpdates[content.id];
    const finalStatus = localStatus || content.status;
    return finalStatus;
  };

  const updateLocalStatus = (contentId, newStatus) => {
    setLocalStatusUpdates((prev) => ({
      ...prev,
      [contentId]: newStatus,
    }));
  };

  const handleStatusChange = async (content, newStatus) => {
    const contentId = content.id;
    updateLocalStatus(contentId, newStatus);

    try {
      const updatedContent = await editContent(contentId, {
        status: newStatus,
      });
      toast.success(
        `Content ${newStatus === "active" ? "activated" : "deactivated"} successfully!`,
      );

      setLocalStatusUpdates((prev) => {
        const newState = { ...prev };
        delete newState[contentId];
        return newState;
      });

      if (onContentUpdated) {
        onContentUpdated(updatedContent);
      }
    } catch (error) {
      console.error(`❌ API ERROR for content ${contentId}:`, error);

      setLocalStatusUpdates((prev) => {
        const newState = { ...prev };
        delete newState[contentId];
        return newState;
      });

      toast.error(
        `Failed to ${newStatus === "active" ? "activate" : "deactivate"} content: ${error.message}`,
      );
    }
  };

  const handleSelect = (content) => {
    setSelectedContents((prevSelected) => {
      if (prevSelected.find((item) => item.id === content.id)) {
        return prevSelected.filter((item) => item.id !== content.id);
      } else {
        return [...prevSelected, content];
      }
    });
    if (onItemClick) onItemClick();
  };

  if (!Array.isArray(contents)) {
    console.error("The 'contents' prop is not an array:", contents);
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Invalid contents data.</p>
        </div>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div>
        <style>{scrollbarStyles}</style>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="text-5xl animate-bounce">📝</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>

            <div className="text-xl font-bold text-gray-900 mb-2">
              Start Your Content Journey
            </div>

            <div className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              Add your first piece of content to join the network. Your content
              gets promoted by others while you help promote theirs.
            </div>

            <button
              data-tour-id="step4-add-content"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openAddContentModal"));
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              ADD YOUR FIRST CONTENT
            </button>

            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="text-xs font-bold uppercase text-gray-500 mb-3">
                What You Can Add
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Article", "Video", "Blog Post", "Podcast", "Thread"].map(
                  (type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                    >
                      {type}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={refreshKey}>
      <style>{scrollbarStyles}</style>

      <StatusLegend />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3 mb-4">
        <div className="text-base font-bold text-gray-900">
          My Content ({contents.length})
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {contents.map((content) => {
          const isSelected = selectedContents.some(
            (item) => item.id === content.id,
          );

          return (
            <ListItem
              key={`${content.id}-${content.share_count}-${content.status}`}
              content={content}
              isSelected={isSelected}
              onSelect={handleSelect}
              onStatusChange={handleStatusChange}
              getCurrentStatus={getCurrentStatus}
              queueStatus={queueStatus}
            />
          );
        })}
      </div>
    </div>
  );
};

List2.propTypes = {
  contents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      content_type: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
      status: PropTypes.string,
      share_count: PropTypes.number,
      required_shares: PropTypes.number,
    }),
  ).isRequired,
  onContentUpdated: PropTypes.func.isRequired,
  onContentDeleted: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
  selectedContents: PropTypes.array.isRequired,
  setSelectedContents: PropTypes.func.isRequired,
  queueStatus: PropTypes.object,
};

export default List2;
