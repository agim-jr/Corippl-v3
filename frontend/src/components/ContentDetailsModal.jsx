import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

// ✅ ENHANCED: Better media type detection with Unsplash support
const detectMediaType = (content) => {
  const mediaUrl = content.media_url || content.file_url || content.url;

  if (!mediaUrl) {
    return { hasMedia: false, mediaUrl: null, mediaType: null };
  }

  const contentType = (content.content_type || "").toLowerCase();
  const urlLower = mediaUrl.toLowerCase();

  // ✅ Check for YouTube URLs first
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

  // ✅ Check for image hosting services (Unsplash, Picsum, etc.)
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

const ContentDetailsModal = ({ isOpen, onClose, content, onCreatorClick }) => {
  const [mediaError, setMediaError] = useState(false);

  if (!content) return null;

  const { hasMedia, mediaUrl, mediaType } = detectMediaType(content);
  const isYouTube = mediaType === "youtube";
  const isImage = mediaType === "image";
  const isVideo = mediaType === "video";
  const isPDF = mediaType === "pdf";
  const isAudio = mediaType === "audio";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
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
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                  <Dialog.Title className="text-lg font-bold uppercase">
                    Content Details
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
                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2 leading-tight">
                      {content.title}
                    </h3>
                  </div>

                  {/* ✅ ENHANCED: Media Preview with better error handling */}
                  {hasMedia && !mediaError && (
                    <div className="rounded border-2 border-gray-200 overflow-hidden">
                      {isYouTube && (
                        <div
                          className="relative w-full bg-black"
                          style={{ paddingBottom: "56.25%" }}
                        >
                          <iframe
                            src={mediaUrl}
                            className="absolute top-0 left-0 w-full h-full"
                            title={content.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onError={() => {
                              console.error(
                                "Failed to load YouTube video:",
                                mediaUrl
                              );
                              setMediaError(true);
                            }}
                          />
                        </div>
                      )}

                      {isImage && (
                        <img
                          src={mediaUrl}
                          alt={content.title}
                          className="w-full h-auto max-h-96 object-contain bg-gray-50"
                          onError={() => {
                            console.error("Failed to load image:", mediaUrl);
                            setMediaError(true);
                          }}
                          loading="lazy"
                        />
                      )}

                      {isVideo && (
                        <video
                          src={mediaUrl}
                          className="w-full h-auto max-h-96"
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
                        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                          <div className="text-center">
                            <span className="text-6xl mb-2 block">📄</span>
                            <span className="text-sm font-bold text-gray-600">
                              PDF DOCUMENT
                            </span>
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Open PDF
                              <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {isAudio && (
                        <div className="w-full p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                          <div className="text-center mb-4">
                            <span className="text-5xl mb-2 block">🎵</span>
                            <span className="text-sm font-bold text-gray-600">
                              AUDIO FILE
                            </span>
                          </div>
                          <audio
                            controls
                            className="w-full"
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
                    </div>
                  )}

                  {/* ✅ NEW: Error state for media */}
                  {hasMedia && mediaError && (
                    <div className="rounded border-2 border-red-200 bg-red-50 p-4 text-center">
                      <span className="text-4xl mb-2 block">⚠️</span>
                      <p className="text-sm font-bold text-red-700 mb-1">
                        Failed to load media
                      </p>
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Open in new tab
                        <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      URL
                    </label>
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {content.url}
                      <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 flex-shrink-0" />
                    </a>
                  </div>

                  {/* Description */}
                  {content.description && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Description
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed">
                        {content.description}
                      </div>
                    </div>
                  )}

                  {/* Guest Content Info - Only show for guest content */}
                  {content.is_guest && (
                    <div className="p-3 bg-purple-50 border-2 border-purple-200 rounded">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">⭐</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-purple-900 mb-1">
                            Guest Content
                          </h4>
                          <p className="text-xs text-purple-700 leading-relaxed mb-2">
                            This content is submitted by a guest creator who
                            isn't part of the reciprocal network. Guest creators
                            don't share back, but you can help them reach their
                            audience.
                          </p>
                          {!content.user?.is_premium && (
                            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5">
                              <span>🎁</span>
                              <span className="font-bold">
                                Share this to earn +2 bonus shuffles!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    {/* Content Type */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Content Type
                      </label>
                      <span className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                        {content.content_type}
                      </span>
                    </div>

                    {/* Share Count */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Shares
                      </label>
                      <span className="text-sm font-bold">
                        {content.share_count || 0} times shared
                      </span>
                    </div>

                    {/* Creator */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Created By
                      </label>
                      {content.is_guest ? (
                        <span className="text-sm font-medium text-purple-700">
                          👤 {content.guest_creator_name || "Guest Creator"}
                        </span>
                      ) : (
                        <button
                          className="text-sm font-medium text-black underline hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => {
                            if (content.user && onCreatorClick) {
                              onCreatorClick(content.user);
                            }
                          }}
                          title={`View ${
                            content.user?.username || "Unknown"
                          }'s profile`}
                        >
                          {content.user?.username || "Unknown"}
                        </button>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Created
                      </label>
                      <span className="text-sm">
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Categories */}
                  {content.categories && content.categories.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Categories
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(content.categories)].map((cat, i) => (
                          <span
                            key={cat + i}
                            className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
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

export default ContentDetailsModal;
