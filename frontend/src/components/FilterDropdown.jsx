// frontend/src/components/FilterDropdown.jsx

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils"; // Optional utility for conditional classes
import { useApi } from "../lib/api"; // ADD THIS IMPORT
import { toast } from "react-toastify"; // ADD THIS IMPORT
import SearchModal from "./SearchModal"; // Import the SearchModal component
import PremiumModal from "./PremiumModal"; // Import your existing PremiumModal

const DROPDOWN_OPTIONS = [
  {
    value: "standard",
    label: "Standard View",
    emoji: "🔍",
    premium: false,
    description: "Basic content matching algorithm",
  },
  {
    value: "rankedContent",
    label: "Ranked Content",
    emoji: "🏆",
    premium: true,
    description: "AI-powered content ranking",
  },
  {
    value: "topPerformers",
    label: "Top Performers",
    emoji: "🔥",
    premium: true,
    description: "High-engagement content only",
  },
];

const VIEW_MODES = [
  { value: "list", label: "List View", icon: "☰" },
  { value: "reel", label: "Reel View", icon: "▦" },
];

export default function FilterDropdown({
  activeFilter,
  setActiveFilter,
  isPremium,
  handleSelectFilter,
  onSearchResults,
  onNewSearch,
  onViewModeChange, // ✅ ADD THIS PROP
}) {
  const { searchContent } = useApi();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypes, setContentTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minViews, setMinViews] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("list");

  // Determine the current value based on activeFilter
  let value = "standard";
  if (activeFilter === "rankedContent" || activeFilter === "topPerformers") {
    value = activeFilter;
  }

  const selectedOption =
    DROPDOWN_OPTIONS.find((o) => o.value === value) || DROPDOWN_OPTIONS[0];

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const handleSearch = async () => {
    try {
      const searchParams = {
        query: searchQuery.trim(),
        categories:
          categories.length > 0
            ? categories.map((cat) => cat.toLowerCase())
            : undefined,
        content_type:
          contentTypes.length > 0
            ? contentTypes.map((type) => type.toLowerCase())
            : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        min_views: minViews ? parseInt(minViews) : undefined,
        sort_by: sortBy,
      };

      console.log("Searching with params:", searchParams);
      const results = await searchContent(searchParams);

      if (onSearchResults) {
        onSearchResults(results);
      }

      setIsSearchModalOpen(false);

      if (results.length === 0) {
        toast.info("No results found for your search criteria.");
      } else {
        toast.success(`Found ${results.length} results.`);
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error(error.message || "Search failed. Please try again.");
    }
  };

  const handleNewSearch = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      setIsSearchModalOpen(true);
    }
  };

  function onSelect(option) {
    setOpen(false);
    if (option.value === "standard") {
      setActiveFilter("standard");
    } else {
      handleSelectFilter(option.value);
    }
  }

  const handleSearchButtonClick = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      if (onNewSearch) {
        onNewSearch();
      } else {
        setIsSearchModalOpen(true);
      }
    }
  };

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setCategories(selectedOptions);
  };

  // ✅ ADD THIS FUNCTION
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left w-full font-mono">
        {/* View Mode Toggle - ADD THIS SECTION */}
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase text-gray-600">
            Content Queue
          </label>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleViewModeChange(mode.value)}
                className={`px-3 py-1 text-xs font-bold font-mono transition-colors ${
                  viewMode === mode.value
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="mr-1">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        {/* Filter Controls Header */}

        {/* Enhanced Dropdown Button */}
        <button
          ref={buttonRef}
          type="button"
          className={cn(
            "flex w-full items-center justify-between border border-gray-300 bg-white px-4 py-3 text-sm font-bold font-mono shadow-sm hover:bg-gray-50 focus:outline-none transition-all rounded",
            open && "bg-gray-50"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">
              {selectedOption.emoji}
            </span>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-black truncate">
                {selectedOption.label}
              </span>
              <span className="text-xs text-gray-500 font-mono truncate">
                {selectedOption.description}
              </span>
            </div>
            {selectedOption.premium && !isPremium && (
              <span className="inline-flex items-center border border-black bg-black px-2 py-1 text-xs font-bold font-mono text-white flex-shrink-0">
                PREMIUM
              </span>
            )}
          </div>
          <svg
            className={cn(
              "ml-3 h-4 w-4 text-black transition-transform flex-shrink-0",
              open ? "rotate-180" : ""
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Enhanced Dropdown List */}
        {open && (
          <div
            ref={dropdownRef}
            className="absolute z-20 mt-2 w-full border border-black bg-white shadow-lg animate-fade-in"
            tabIndex={-1}
            role="listbox"
            onKeyDown={handleKeyDown}
          >
            {/* Options List */}
            <ul className="divide-y divide-gray-200">
              {DROPDOWN_OPTIONS.map((option, index) => {
                const selected = value === option.value;
                return (
                  <li
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer select-none items-center px-4 py-3 gap-3 transition-colors font-mono",
                      selected
                        ? "bg-black text-white"
                        : "hover:bg-gray-100 text-gray-900",
                      option.premium && !isPremium && !selected && "opacity-60"
                    )}
                    role="option"
                    aria-selected={selected}
                    tabIndex={0}
                    onClick={() => onSelect(option)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(option);
                      }
                    }}
                  >
                    <span className="text-lg flex-shrink-0">
                      {option.emoji}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold truncate">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-mono truncate",
                          selected ? "text-gray-300" : "text-gray-500"
                        )}
                      >
                        {option.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {option.premium && !isPremium && (
                        <span
                          className={cn(
                            "inline-flex items-center border px-2 py-1 text-xs font-bold font-mono",
                            selected
                              ? "border-white bg-white text-black"
                              : "border-black bg-black text-white"
                          )}
                        >
                          PREMIUM
                        </span>
                      )}
                      {selected && (
                        <svg
                          className="h-4 w-4 text-current flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Enhanced Search Section */}
            <div className="border-t border-gray-300 bg-gray-50">
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-700 font-mono">
                    🔍 ADVANCED SEARCH
                  </span>
                  {!isPremium && (
                    <span className="inline-flex items-center border border-black bg-black px-2 py-1 text-xs font-bold font-mono text-white">
                      PREMIUM
                    </span>
                  )}
                </div>
                <button
                  data-search-button
                  onClick={handleSearchButtonClick}
                  className={cn(
                    "w-full border font-mono text-sm font-bold transition-all py-2 px-3",
                    !isPremium
                      ? "border-gray-400 bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300"
                      : "border-black bg-black text-white hover:bg-white hover:text-black"
                  )}
                >
                  {!isPremium
                    ? "🔒 UNLOCK ADVANCED SEARCH"
                    : "🚀 OPEN SEARCH INTERFACE"}
                </button>
                {!isPremium && (
                  <p className="text-xs text-gray-500 font-mono mt-2 text-center">
                    Search by keywords, content type, date range & more
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Animation Styles */}
        <style>
          {`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-0.5rem) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: top;
          }
          `}
        </style>
      </div>

      {/* Premium Modal for non-premium users */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />

      {/* Search Modal - Only for Premium Users */}
      {isPremium && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          setCategories={setCategories}
          contentTypes={contentTypes}
          setContentTypes={setContentTypes}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          minViews={minViews}
          setMinViews={setMinViews}
          sortBy={sortBy}
          setSortBy={setSortBy}
          handleSearch={handleSearch}
          onSearchResults={onSearchResults}
          isPremium={isPremium}
        />
      )}
    </>
  );
}
