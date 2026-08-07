import { useApi } from "../lib/api";
import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import PropTypes from "prop-types";
import { CATEGORIES } from "../lib/constants";
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// Custom Scrollbar
const scrollbarStyles = `
  .search-modal-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .search-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .search-modal-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .search-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }
`;

export default function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  categories,
  setCategories,
  contentTypes,
  setContentTypes,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  minViews,
  setMinViews,
  sortBy,
  setSortBy,
  handleSearch,
  onSearchResults,
  isPremium,
}) {
  const { getContentTypes, searchContent } = useApi();
  const [localContentTypes, setLocalContentTypes] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelpSection, setShowHelpSection] = useState(false);

  const steps = [
    { id: 1, title: "Search Query", description: "What are you looking for?" },
    { id: 2, title: "Categories & Types", description: "Filter by content" },
    { id: 3, title: "Date & Performance", description: "Refine your results" },
    { id: 4, title: "Sort & Execute", description: "Run your search" },
  ];

  const resetForm = () => {
    setSearchQuery("");
    setCategories([]);
    setContentTypes([]);
    setDateFrom("");
    setDateTo("");
    setMinViews("");
    setSortBy("relevance");
    setCurrentStep(1);
    setShowHelpSection(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      getContentTypes()
        .then((types) => {
          setLocalContentTypes(types);
        })
        .catch((err) => {
          console.error("Failed to fetch content types:", err);
        });
    }
  }, [isOpen, getContentTypes]);

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setCategories(selectedOptions);
  };

  const validateAllSteps = () => {
    if (searchQuery.trim().length === 0) {
      alert("Please enter a search query");
      setCurrentStep(1);
      return false;
    }
    if (categories.length === 0) {
      alert("Please select at least one category");
      setCurrentStep(2);
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllSteps()) {
      return;
    }

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
      console.log("Search results:", results);

      if (onSearchResults) {
        onSearchResults(results);
      }

      onClose();
    } catch (error) {
      console.error("Search failed:", error);
      alert(error.message || "Search failed. Please try again.");
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep = (step) => {
    switch (step) {
      case 1:
        return searchQuery.trim().length > 0;
      case 2:
        return categories.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Search Query *
              </label>
              <div className="bg-white border border-gray-300 rounded">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter keywords or topics..."
                  className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed mt-2">
                <p className="text-gray-700">
                  Use specific keywords for better results. Try "social media
                  marketing" instead of just "marketing" for more targeted
                  content.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Categories *
              </label>
              <div className="bg-white border border-gray-300 rounded">
                <select
                  multiple
                  value={categories}
                  onChange={handleCategoryChange}
                  className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black h-32"
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed mt-2">
                <p className="text-gray-700">
                  Hold Ctrl (Windows) or Command (Mac) to select multiple
                  categories. Multiple categories will broaden your search
                  results.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Content Types (Optional)
              </label>
              <div className="bg-white border border-gray-300 rounded">
                <select
                  multiple
                  value={contentTypes}
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setContentTypes(selectedOptions);
                  }}
                  className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black h-24"
                >
                  {localContentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed mt-2">
                <p className="text-gray-700">
                  Filter by specific content types like articles, videos,
                  podcasts, etc.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">From</div>
                  <div className="bg-white border border-gray-300 rounded">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">To</div>
                  <div className="bg-white border border-gray-300 rounded">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed mt-2">
                <p className="text-gray-700">
                  Optional: Limit results to content published within a specific
                  date range.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Performance Filter
              </label>
              <div className="bg-white border border-gray-300 rounded">
                <input
                  type="number"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                  placeholder="Minimum view count (e.g. 1000)"
                  className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed mt-2">
                <p className="text-gray-700">
                  Optional: Find high-performing content by setting a minimum
                  view threshold.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Sort Results
              </label>
              <div className="bg-white border border-gray-300 rounded">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full px-3 py-3 border-none rounded focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date (Newest First)</option>
                  <option value="views">View Count (Highest First)</option>
                </select>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed mt-2">
                <p className="text-gray-700">
                  Choose how to order your search results for best experience.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                Search Summary
              </label>
              <div className="bg-white border border-gray-300 rounded">
                <div className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Query:</span>
                      <span className="font-medium">"{searchQuery}"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categories:</span>
                      <span className="font-medium">
                        {categories.join(", ") || "All"}
                      </span>
                    </div>
                    {contentTypes.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Content Types:</span>
                        <span className="font-medium">
                          {contentTypes.join(", ")}
                        </span>
                      </div>
                    )}
                    {(dateFrom || dateTo) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date Range:</span>
                        <span className="font-medium">
                          {dateFrom || "Any"} to {dateTo || "Any"}
                        </span>
                      </div>
                    )}
                    {minViews && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Views:</span>
                        <span className="font-medium">{minViews}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sort By:</span>
                      <span className="font-medium">{sortBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
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
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                  <Dialog.Title className="text-lg font-bold uppercase">
                    Advanced Search - Step {currentStep}/4
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
                  {/* Help Section */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHelpSection(!showHelpSection)}
                      className="flex items-center text-xs text-gray-600 hover:text-black transition"
                    >
                      {showHelpSection ? (
                        <ChevronDownIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-1" />
                      )}
                      {showHelpSection
                        ? "Hide search tips"
                        : "Show search tips"}
                    </button>

                    {showHelpSection && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm leading-relaxed">
                        <div className="text-blue-800">
                          <div className="font-medium mb-2">
                            Advanced Search Tips:
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• Use specific keywords for better results</li>
                            <li>
                              • Select multiple categories to broaden your
                              search
                            </li>
                            <li>
                              • Use date ranges to find trending or evergreen
                              content
                            </li>
                            <li>
                              • Filter by views to find high-performing content
                            </li>
                            <li>
                              • Relevance sorting shows best matches first
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Header */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                      Current Step
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <div className="font-medium text-gray-900">
                        {steps[currentStep - 1].title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {steps[currentStep - 1].description}
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <form onSubmit={handleFormSubmit}>
                    {renderStepContent()}

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentStep === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Back
                      </button>

                      {currentStep < steps.length ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={!canProceedFromStep(currentStep)}
                          className="px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-6 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition"
                        >
                          🔍 Search
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

SearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  setCategories: PropTypes.func.isRequired,
  contentTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  setContentTypes: PropTypes.func.isRequired,
  dateFrom: PropTypes.string.isRequired,
  setDateFrom: PropTypes.func.isRequired,
  dateTo: PropTypes.string.isRequired,
  setDateTo: PropTypes.func.isRequired,
  minViews: PropTypes.string.isRequired,
  setMinViews: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  onSearchResults: PropTypes.func,
  isPremium: PropTypes.bool.isRequired,
};
