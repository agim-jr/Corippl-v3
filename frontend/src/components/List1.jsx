"use client";

import React, { useState, useEffect, useContext } from "react";
import { useApi } from "../lib/api";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import MatchProfileModal from "./MatchProfileModal";
import FlagContentModal from "./FlagContentModal";
import { AuthContext } from "../contexts/AuthContext";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import ContentDetailsModal from "./ContentDetailsModal";

const scrollbarStyles = `
  .list1-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .list1-scrollbar::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 4px;
  }
  .list1-scrollbar::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  .list1-scrollbar {
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

const ListItem = ({
  post,
  isSelected,
  onSelect,
  onCreatorClick,
  dataTourId,
}) => {
  const { flagContent } = useApi();
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleFlagSubmit = async (reason) => {
    try {
      await flagContent(post.id, reason);
      toast.success("Content flagged successfully.");
      setIsFlagModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to flag content.");
    }
  };

  return (
    <div
      {...(dataTourId ? { "data-tour-id": dataTourId } : {})}
      className={`group cursor-pointer rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? "bg-gray-50 border-black shadow-lg"
          : "bg-white border-gray-200 hover:border-gray-400 hover:shadow-md"
      }`}
      onClick={() => onSelect(post)}
      tabIndex={0}
      role="option"
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onSelect(post);
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
                title={post.title}
              >
                {post.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <time dateTime={new Date(post.created_at).toISOString()}>
                  {new Date(post.created_at).toLocaleDateString()}
                </time>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex-shrink-0 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlagModalOpen(true);
            }}
            aria-label="Flag this content"
          >
            🚩 Flag
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {contentTypeBadge(post.content_type)}
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
            {Number(post.share_count || 0).toLocaleString()}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsModalOpen(true);
            }}
            className="flex-shrink-0 text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-lg p-1.5 transition-all"
            title="View content details"
          >
            <InformationCircleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FlagContentModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        onSubmit={handleFlagSubmit}
      />
      <ContentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        content={post}
        onCreatorClick={onCreatorClick}
      />
    </div>
  );
};

ListItem.propTypes = {
  post: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onCreatorClick: PropTypes.func.isRequired,
  dataTourId: PropTypes.string,
};

const List1 = ({
  onItemClick,
  selectedMatches,
  setSelectedMatches,
  activeFilter,
  searchResults,
  isSearchActive,
  onClearSearch,
  onNewSearch,
  triggerRefresh,
  shuffledPosts,
  onShuffleConsumed,
  userContents,
}) => {
  const { getMatchedContent, shuffleMatches, getRemainingShuffles } = useApi();
  const { isPremium } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [remainingShuffles, setRemainingShuffles] = useState(0);

  const handleCreatorClick = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    if (!isSearchActive) {
      const fetchMatchedContent = async () => {
        try {
          const isRankedContent = activeFilter === "rankedContent";
          const isTopPerformers = activeFilter === "topPerformers";
          const data = await getMatchedContent(
            isRankedContent,
            isTopPerformers,
            { limit: 4 },
          );
          setPosts(data);
        } catch (err) {
          setError(err.message || "Failed to fetch matched content.");
          toast.error("Failed to load matched content.");
        } finally {
          setLoading(false);
        }
      };
      fetchMatchedContent();
    }
  }, [getMatchedContent, activeFilter, triggerRefresh, isSearchActive]);

  useEffect(() => {
    if (shuffledPosts && shuffledPosts.length > 0) {
      setPosts(shuffledPosts);
      setLoading(false);
      if (onShuffleConsumed) onShuffleConsumed();
    }
  }, [shuffledPosts, onShuffleConsumed]);

  useEffect(() => {
    if (isSearchActive && searchResults && searchResults.length > 0) {
      setPosts(searchResults);
    }
  }, [searchResults, isSearchActive]);

  const handleSelect = (post) => {
    setSelectedMatches((prevSelected) => {
      const isAlreadySelected = prevSelected.find(
        (item) => item.id === post.id,
      );
      if (isAlreadySelected) {
        return prevSelected.filter((item) => item.id !== post.id);
      } else {
        const updatedPost = {
          ...post,
          required_shares: post.required_shares || 5,
        };
        return [...prevSelected, updatedPost];
      }
    });
    if (onItemClick) onItemClick();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center text-gray-500">
          Loading matched content...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <div className="text-xl font-bold text-gray-900 mb-2">
            {isSearchActive ? "No search results found" : "No Matches Yet"}
          </div>
          <div className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            {isSearchActive ? (
              "Try adjusting your search criteria or start a new search"
            ) : !userContents || userContents.length === 0 ? (
              <>
                <strong>Add your first content</strong> to start getting matched
                with relevant creators
              </>
            ) : userContents.filter((c) => c.status === "active").length ===
              0 ? (
              <>
                <strong>Activate your content</strong> to start receiving
                matches from other creators
              </>
            ) : (
              "We're finding the best matches for you. Check back soon!"
            )}
          </div>

          {!isSearchActive && (!userContents || userContents.length === 0) && (
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openAddContentModal"))
              }
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Your First Content
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayedPosts = posts.slice(0, 3);

  return (
    <div>
      <style>{scrollbarStyles}</style>

      {isSearchActive && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-gray-900">
                {searchResults?.length || 0} results found
              </div>
              <div className="text-sm text-gray-600">
                Use filters or start a new search to refine results
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onNewSearch}
                className="px-4 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-colors"
              >
                New Search
              </button>
              <button
                onClick={onClearSearch}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="list1-scrollbar overflow-y-auto max-h-[60vh] space-y-3">
        {displayedPosts.map((post, idx) => (
          <ListItem
            key={post.id}
            post={post}
            isSelected={selectedMatches.some((item) => item.id === post.id)}
            onSelect={handleSelect}
            onCreatorClick={handleCreatorClick}
            dataTourId={idx === 0 ? "step4-select-content" : undefined}
          />
        ))}
      </div>

      {selectedUser && (
        <MatchProfileModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          user={selectedUser}
        />
      )}
    </div>
  );
};

List1.propTypes = {
  onItemClick: PropTypes.func.isRequired,
  selectedMatches: PropTypes.array.isRequired,
  setSelectedMatches: PropTypes.func.isRequired,
  activeFilter: PropTypes.string.isRequired,
  searchResults: PropTypes.array,
  isSearchActive: PropTypes.bool,
  onClearSearch: PropTypes.func,
  onNewSearch: PropTypes.func,
  triggerRefresh: PropTypes.number,
  shuffledPosts: PropTypes.array,
  onShuffleConsumed: PropTypes.func,
  userContents: PropTypes.array,
};

export default List1;
