// frontend/src/components/Reel.jsx

import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { useApi } from "../lib/api";
import MatchProfileModal from "./MatchProfileModal";
import FlagContentModal from "./FlagContentModal";
import ContentDetailsModal from "./ContentDetailsModal";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const scrollbarStyles = `
  .reel-horizontal-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .reel-horizontal-scrollbar::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 4px;
  }
  .reel-horizontal-scrollbar::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
  }
  .reel-horizontal-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #000 #f5f5f5;
  }
`;

function contentTypeBadge(type) {
  const typeMap = {
    article: {
      label: "Article",
      emoji: "📰",
      classes: "bg-blue-50 text-blue-700 border-2 border-blue-200",
    },
    video: {
      label: "Video",
      emoji: "🎬",
      classes: "bg-red-50 text-red-700 border-2 border-red-200",
    },
    image: {
      label: "Image",
      emoji: "🖼️",
      classes: "bg-yellow-50 text-yellow-800 border-2 border-yellow-200",
    },
    pdf: {
      label: "PDF",
      emoji: "📄",
      classes: "bg-green-50 text-green-700 border-2 border-green-200",
    },
    code: {
      label: "Code",
      emoji: "💻",
      classes: "bg-indigo-50 text-indigo-700 border-2 border-indigo-200",
    },
    audio: {
      label: "Audio",
      emoji: "🎵",
      classes: "bg-purple-50 text-purple-700 border-2 border-purple-200",
    },
    podcast: {
      label: "Podcast",
      emoji: "🎙️",
      classes: "bg-pink-50 text-pink-700 border-2 border-pink-200",
    },
    presentation: {
      label: "Presentation",
      emoji: "📊",
      classes: "bg-orange-50 text-orange-700 border-2 border-orange-200",
    },
    thread: {
      label: "Thread",
      emoji: "🧵",
      classes: "bg-teal-50 text-teal-700 border-2 border-teal-200",
    },
    link: {
      label: "Link",
      emoji: "🔗",
      classes: "bg-gray-50 text-gray-700 border-2 border-gray-200",
    },
    note: {
      label: "Note",
      emoji: "📝",
      classes: "bg-lime-50 text-lime-700 border-2 border-lime-200",
    },
    newsletter: {
      label: "Newsletter",
      emoji: "✉️",
      classes: "bg-sky-50 text-sky-700 border-2 border-sky-200",
    },
    blog: {
      label: "Blog",
      emoji: "✍️",
      classes: "bg-rose-50 text-rose-700 border-2 border-rose-200",
    },
    default: {
      label: type,
      emoji: "📦",
      classes: "bg-gray-100 text-gray-600 border-2 border-gray-300",
    },
  };

  const t = (type || "").toLowerCase();
  const { label, emoji, classes } = typeMap[t] || typeMap.default;

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      <span className="mr-1">{emoji}</span>
      {label}
    </span>
  );
}

const detectMediaType = (post) => {
  // Priority: media_url > file_url > url
  const mediaUrl = post.media_url || post.file_url || post.url;

  if (!mediaUrl) {
    return { hasMedia: false, mediaUrl: null, mediaType: null };
  }

  const contentType = (post.content_type || "").toLowerCase();
  const urlLower = mediaUrl.toLowerCase();

  // Check for YouTube URLs first
  if (
    urlLower.includes("youtube.com/embed/") ||
    urlLower.includes("youtube.com/watch?v=") ||
    urlLower.includes("youtu.be/")
  ) {
    let embedUrl = mediaUrl;
    if (mediaUrl.includes("watch?v=")) {
      const videoId = mediaUrl.split("watch?v=")[1].split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (mediaUrl.includes("youtu.be/")) {
      const videoId = mediaUrl.split("youtu.be/")[1].split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    return { hasMedia: true, mediaUrl: embedUrl, mediaType: "youtube" };
  }

  // Check for image hosting services
  if (
    urlLower.includes("unsplash.com") ||
    urlLower.includes("picsum.photos") ||
    urlLower.includes("imgur.com") ||
    urlLower.includes("cloudinary.com")
  ) {
    return { hasMedia: true, mediaUrl, mediaType: "image" };
  }

  // Check if content_type explicitly says it's media
  if (
    contentType === "image" ||
    contentType === "video" ||
    contentType === "pdf" ||
    contentType === "audio"
  ) {
    return {
      hasMedia: true,
      mediaUrl,
      mediaType: contentType,
    };
  }

  // Check URL file extension
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(urlLower)) {
    return { hasMedia: true, mediaUrl, mediaType: "image" };
  }
  if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(urlLower)) {
    return { hasMedia: true, mediaUrl, mediaType: "video" };
  }
  if (/\.pdf$/i.test(urlLower)) {
    return { hasMedia: true, mediaUrl, mediaType: "pdf" };
  }
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(urlLower)) {
    return { hasMedia: true, mediaUrl, mediaType: "audio" };
  }

  // Has URL but not a recognized media type
  return { hasMedia: false, mediaUrl, mediaType: null };
};

const ReelCard = ({ post, isSelected, onSelect, onCreatorClick }) => {
  const { flagContent } = useApi();
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const handleFlagSubmit = async (reason) => {
    try {
      await flagContent(post.id, reason);
      toast.success("Content flagged successfully.");
      setIsFlagModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to flag content.");
    }
  };

  const { hasMedia, mediaUrl, mediaType } = detectMediaType(post);
  const isImage = mediaType === "image";
  const isVideo = mediaType === "video";
  const isPDF = mediaType === "pdf";
  const isAudio = mediaType === "audio";
  const isYouTube = mediaType === "youtube";

  const getFallbackEmoji = () => {
    const type = (post.content_type || "").toLowerCase();
    const emojiMap = {
      article: "📰",
      video: "🎬",
      image: "🖼️",
      code: "💻",
      audio: "🎵",
      podcast: "🎙️",
      pdf: "📄",
      link: "🔗",
      note: "📝",
      blog: "✍️",
      newsletter: "✉️",
    };
    return emojiMap[type] || "📦";
  };

  return (
    <div
      className={`group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 flex-shrink-0 w-64 ${
        isSelected
          ? "ring-4 ring-black shadow-xl"
          : "border-gray-300 hover:border-black hover:shadow-lg"
      }`}
      onClick={() => onSelect(post)}
    >
      {/* Media rendering with better error handling */}
      {hasMedia && !mediaError && (
        <div className="relative w-full bg-gray-100">
          {isImage && (
            <img
              src={mediaUrl}
              alt={post.title}
              className="w-full h-48 object-cover"
              onError={() => {
                console.error("Failed to load image:", mediaUrl);
                setMediaError(true);
              }}
              loading="lazy"
            />
          )}

          {isYouTube && (
            <div className="relative w-full h-48 bg-black">
              <iframe
                src={mediaUrl}
                className="w-full h-full"
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => {
                  console.error("Failed to load YouTube video:", mediaUrl);
                  setMediaError(true);
                }}
              />
            </div>
          )}

          {isVideo && (
            <video
              src={mediaUrl}
              className="w-full h-48 object-cover"
              controls
              preload="metadata"
              onError={() => {
                console.error("Failed to load video:", mediaUrl);
                setMediaError(true);
              }}
            >
              <source
                src={mediaUrl}
                type={`video/${mediaUrl.split(".").pop()}`}
              />
              Your browser does not support the video tag.
            </video>
          )}

          {isPDF && (
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 border-b-2 border-gray-200">
              <div className="text-center">
                <span className="text-6xl mb-2 block">📄</span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  PDF Document
                </span>
              </div>
            </div>
          )}

          {isAudio && (
            <div className="w-full h-48 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 border-b-2 border-gray-200">
              <div className="text-center mb-4">
                <span className="text-6xl mb-2 block">🎵</span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Audio File
                </span>
              </div>
              <audio
                controls
                className="w-4/5"
                preload="metadata"
                onError={() => {
                  console.error("Failed to load audio:", mediaUrl);
                  setMediaError(true);
                }}
              >
                <source
                  src={mediaUrl}
                  type={`audio/${mediaUrl.split(".").pop()}`}
                />
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          {/* Selection overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
              <div className="w-14 h-14 rounded-full bg-black border-2 border-white flex items-center justify-center shadow-xl">
                <svg
                  className="w-9 h-9 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback for no media or error */}
      {(!hasMedia || mediaError) && (
        <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b-2 border-gray-200">
          <div className="text-center p-4">
            <span className="text-5xl mb-2 block opacity-60">
              {getFallbackEmoji()}
            </span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {post.content_type || "Content"}
            </span>
            {mediaError && (
              <div className="mt-2 text-xs text-red-600 font-bold">
                Failed to load media
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content details */}
      <div className="p-3 bg-white">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
          {post.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          {contentTypeBadge(post.content_type)}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsModalOpen(true);
            }}
            className="text-gray-500 hover:text-black transition-colors p-1 rounded-lg hover:bg-gray-100"
            title="View details"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
          <span className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.5 3a3.5 3.5 0 0 0-3.456 4.06L8.143 9.704a3.5 3.5 0 1 0-.01 4.6l5.91 2.65a3.5 3.5 0 1 0 .863-1.805l-5.94-2.662a3.53 3.53 0 0 0 .002-.961l5.948-2.667A3.5 3.5 0 1 0 17.5 3Z" />
            </svg>
            {Number(post.share_count || 0).toLocaleString()}
          </span>
          <time
            className="truncate"
            dateTime={new Date(post.created_at).toISOString()}
          >
            {new Date(post.created_at).toLocaleDateString()}
          </time>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFlagModalOpen(true);
          }}
          className="w-full mt-3 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 transition-all hover:shadow-sm"
        >
          🚩 Flag Content
        </button>
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

ReelCard.propTypes = {
  post: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onCreatorClick: PropTypes.func.isRequired,
};

const Reel = ({
  onItemClick,
  selectedMatches,
  setSelectedMatches,
  activeFilter,
  searchResults,
  isSearchActive,
  shuffledPosts,
  onShuffleConsumed,
  onClearSearch,
}) => {
  const { getMatchedContent } = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const justShuffledRef = useRef(false);
  const prevFilterRef = useRef(activeFilter);

  const handleCreatorClick = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  };

  // Effect 1: Handle shuffled posts
  useEffect(() => {
    if (shuffledPosts && shuffledPosts.length > 0) {
      console.log("🎲 Reel: Displaying shuffle results:", shuffledPosts.length);
      setPosts(shuffledPosts);
      setLoading(false);
      justShuffledRef.current = true;

      if (onShuffleConsumed) {
        onShuffleConsumed();
      }

      setTimeout(() => {
        justShuffledRef.current = false;
      }, 500);
    }
  }, [shuffledPosts, onShuffleConsumed]);

  // Effect 2: Handle search results
  useEffect(() => {
    if (isSearchActive) {
      console.log(
        "🔍 Reel: Displaying search results:",
        searchResults?.length || 0,
      );

      if (searchResults && searchResults.length > 0) {
        setPosts(searchResults.slice(0, 4));
      } else {
        setPosts([]);
      }
      setLoading(false);
    }
  }, [searchResults, isSearchActive]);

  // Effect 3: Fetch regular content
  useEffect(() => {
    const filterChanged = prevFilterRef.current !== activeFilter;
    if (filterChanged) {
      console.log(
        "📡 Reel: Filter changed from",
        prevFilterRef.current,
        "to",
        activeFilter,
      );
      prevFilterRef.current = activeFilter;
    }

    if (
      (shuffledPosts && shuffledPosts.length > 0) ||
      isSearchActive ||
      justShuffledRef.current
    ) {
      console.log(
        "📡 Reel: Skipping fetch - shuffle/search active or just shuffled",
      );
      return;
    }

    const fetchMatchedContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const isRankedContent = activeFilter === "rankedContent";
        const isTopPerformers = activeFilter === "topPerformers";

        console.log(
          "📡 Reel: Fetching regular content with filter:",
          activeFilter,
        );

        const data = await getMatchedContent(
          isRankedContent,
          isTopPerformers,
          null,
          4,
        );

        console.log("📡 Reel: Received", data.length, "items");
        setPosts(data.slice(0, 4));
      } catch (err) {
        console.error("❌ Reel fetch error:", err);
        setError(err.message || "Failed to fetch matched content.");
        toast.error("Failed to load matched content.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedContent();
  }, [getMatchedContent, activeFilter, shuffledPosts, isSearchActive]);

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
      <div className="mt-6 px-2">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-600 font-bold text-sm">
            Loading content...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 px-2">
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-sm">
          <p className="text-red-700 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="mt-6 px-2">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <div className="text-base font-bold text-gray-900 mb-2">
            {isSearchActive
              ? "No search results found"
              : "No content available"}
          </div>
          <div className="text-sm text-gray-600 font-medium mb-4">
            {isSearchActive
              ? "Try adjusting your search criteria"
              : "Check back later for new content"}
          </div>
          {isSearchActive && onClearSearch && (
            <button
              onClick={onClearSearch}
              className="px-5 py-2.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <style>{scrollbarStyles}</style>
      <div className="reel-horizontal-scrollbar overflow-x-auto overflow-y-hidden px-2 pb-4 pt-2">
        <div className="flex gap-4">
          {posts.map((post) => (
            <ReelCard
              key={`reel-${post.id}-${Date.now()}`}
              post={post}
              isSelected={selectedMatches.some((item) => item.id === post.id)}
              onSelect={handleSelect}
              onCreatorClick={handleCreatorClick}
            />
          ))}
        </div>
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

Reel.propTypes = {
  onItemClick: PropTypes.func.isRequired,
  selectedMatches: PropTypes.array.isRequired,
  setSelectedMatches: PropTypes.func.isRequired,
  activeFilter: PropTypes.string.isRequired,
  searchResults: PropTypes.array,
  isSearchActive: PropTypes.bool,
  shuffledPosts: PropTypes.array,
  onShuffleConsumed: PropTypes.func,
  onClearSearch: PropTypes.func,
};

export default Reel;
