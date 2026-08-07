import React from "react";
import PropTypes from "prop-types";

// src/components/Badge.jsx - Replace the entire contentTypeBadge function

export const ContentTypeBadge = ({ type }) => {
  const typeMap = {
    // Core content types
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

    // Legacy category types (keep for backwards compatibility)
    technology: {
      label: "Tech",
      emoji: "🛠️",
      classes: "bg-cyan-50 text-cyan-700",
    },
    art: {
      label: "Creative",
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

    default: {
      label: type || "Unknown",
      emoji: "📦",
      classes: "bg-gray-100 text-gray-600",
    },
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
};

ContentTypeBadge.propTypes = {
  type: PropTypes.string.isRequired,
};

export const StatusBadge = ({ status }) => {
  const statusMap = {
    shared: {
      label: "Shared",
      svg: (
        <svg
          viewBox="0 0 6 6"
          aria-hidden="true"
          className="size-1.5 fill-green-500"
        >
          <circle r={3} cx={3} cy={3} />
        </svg>
      ),
      classes: "bg-green-100 text-green-700",
    },
    pending: {
      label: "Pending",
      svg: (
        <svg
          viewBox="0 0 6 6"
          aria-hidden="true"
          className="size-1.5 fill-yellow-500"
        >
          <circle r={3} cx={3} cy={3} />
        </svg>
      ),
      classes: "bg-yellow-100 text-yellow-800",
    },
    active: {
      label: "Active",
      svg: (
        <svg
          viewBox="0 0 6 6"
          aria-hidden="true"
          className="size-1.5 fill-blue-500"
        >
          <circle r={3} cx={3} cy={3} />
        </svg>
      ),
      classes: "bg-blue-100 text-blue-700",
    },
    inactive: {
      label: "Inactive",
      svg: (
        <svg
          viewBox="0 0 6 6"
          aria-hidden="true"
          className="size-1.5 fill-gray-400"
        >
          <circle r={3} cx={3} cy={3} />
        </svg>
      ),
      classes: "bg-gray-200 text-gray-700",
    },
    error: {
      label: "Error",
      svg: (
        <svg
          viewBox="0 0 6 6"
          aria-hidden="true"
          className="size-1.5 fill-red-500"
        >
          <circle r={3} cx={3} cy={3} />
        </svg>
      ),
      classes: "bg-red-100 text-red-700",
    },
    default: {
      label: status || "Unknown",
      svg: (
        <svg
          viewBox="0 0 6 6"
          aria-hidden="true"
          className="size-1.5 fill-gray-500"
        >
          <circle r={3} cx={3} cy={3} />
        </svg>
      ),
      classes: "bg-gray-100 text-gray-600",
    },
  };

  const key = (status || "").toLowerCase();
  const { label, svg, classes } = statusMap[key] || statusMap.default;

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${classes}`}
    >
      {svg}
      {label}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
