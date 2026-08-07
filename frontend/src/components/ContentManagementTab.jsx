import React, { useState, useEffect, useMemo, useContext } from "react";
import PropTypes from "prop-types";
import { ContentTypeBadge, StatusBadge } from "./Badge";
import { toast } from "react-toastify";
import { useApi } from "../lib/api";
import { AuthContext } from "../contexts/AuthContext"; // ✅ Add this import
import {
  ChartBarIcon,
  SparklesIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ClipboardIcon } from "@heroicons/react/24/solid";

const ContentManagementTab = ({
  contentDetails,
  handleEdit,
  handleDeleteClick,
  enhanceLink,
  getContentDetails,
  setContentDetails,
  isPremium,
  isAITier = false,
  onOpenPremiumModal, // ✅ ADD THIS
}) => {
  // ✅ ADD THIS LINE - Get user from context
  const { user } = useContext(AuthContext);
  const {
    upgradeToAITier,
    predictContentSharing,
    getContentAIInsights,
    getMLInsights,
  } = useApi();

  const [processingIds, setProcessingIds] = useState(new Set());
  const [mlPredictions, setMLPredictions] = useState({});
  const [loadingPredictions, setLoadingPredictions] = useState(new Set());
  const [selectedContentForAI, setSelectedContentForAI] = useState(null);

  const [isMobilePredictionModalOpen, setIsMobilePredictionModalOpen] =
    useState(false);
  const [mobilePredictionContent, setMobilePredictionContent] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAI, setFilterAI] = useState("all");

  // Filter and search content
  const filteredContent = useMemo(() => {
    return contentDetails.filter((content) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        content.title?.toLowerCase().includes(searchLower) ||
        content.description?.toLowerCase().includes(searchLower) ||
        content.original_text?.toLowerCase().includes(searchLower);

      // Type filter
      const matchesType =
        filterType === "all" || content.content_type === filterType;

      // AI filter (for AI tier users)
      if (filterAI !== "all" && isAITier) {
        const hasAI =
          mlPredictions[content.id] && !mlPredictions[content.id].error;
        const matchesAI =
          (filterAI === "predicted" && hasAI) ||
          (filterAI === "not-predicted" && !hasAI);
        return matchesSearch && matchesType && matchesAI;
      }

      return matchesSearch && matchesType;
    });
  }, [
    contentDetails,
    searchQuery,
    filterType,
    filterAI,
    mlPredictions,
    isAITier,
  ]);

  // Stats for display
  const stats = useMemo(() => {
    const total = contentDetails.length;
    const withAI = isAITier
      ? contentDetails.filter(
          (c) => mlPredictions[c.id] && !mlPredictions[c.id].error,
        ).length
      : 0;
    return { total, withAI, withoutAI: total - withAI };
  }, [contentDetails, mlPredictions, isAITier]);

  const toggleExpand = (contentId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contentId)) {
        newSet.delete(contentId);
      } else {
        newSet.add(contentId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const getMLPrediction = async (contentId, retryCount = 0) => {
    const MAX_RETRIES = 2;

    if (
      !isAITier ||
      loadingPredictions.has(contentId) ||
      (mlPredictions[contentId] && !mlPredictions[contentId]?.error)
    ) {
      return null;
    }

    try {
      setLoadingPredictions((prev) => new Set(prev).add(contentId));
      const prediction = await predictContentSharing(contentId);

      setMLPredictions((prev) => ({
        ...prev,
        [contentId]: prediction.prediction,
      }));

      return prediction.prediction;
    } catch (error) {
      console.error(`ML prediction failed for content ${contentId}:`, error);

      const isRateLimit = error.status === 429;
      const isForbidden = error.status === 403;
      const isBadRequest = error.status === 400;
      const isServerError = error.status >= 500;

      // Retry logic for rate limits only
      if (isRateLimit && retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 2000;

        if (retryCount === 0) {
          toast.info(`⏱️ Rate limited. Retrying in ${delay / 1000}s...`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return getMLPrediction(contentId, retryCount + 1);
      }

      setMLPredictions((prev) => ({
        ...prev,
        [contentId]: {
          error: true,
          message: isRateLimit
            ? "Rate limited"
            : isForbidden
              ? "AI tier required"
              : isBadRequest
                ? "Invalid content"
                : isServerError
                  ? "Server error"
                  : "Failed to load",
          isRateLimit,
          isForbidden,
          retryable: isRateLimit || isServerError,
          timestamp: Date.now(),
          httpStatus: error.status,
        },
      }));

      if (isRateLimit && retryCount >= MAX_RETRIES) {
        toast.error("⏱️ Too many requests. Please wait a few minutes.");
      } else if (isForbidden) {
        toast.error("🔒 AI Enhanced subscription required");
      } else if (!isBadRequest && !isRateLimit) {
        toast.error("❌ Failed to load prediction");
      }

      return null;
    } finally {
      setLoadingPredictions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };

  const MLInsightsBadge = ({
    contentId,
    prediction,
    isLoading,
    onLoadPrediction,
    content,
  }) => {
    const [hasTriedLoading, setHasTriedLoading] = useState(false);

    useEffect(() => {
      if (!prediction && !isLoading && !hasTriedLoading) {
        setHasTriedLoading(true);
        onLoadPrediction(contentId);
      }
    }, [contentId, prediction, isLoading, hasTriedLoading, onLoadPrediction]);

    if (isLoading) {
      return (
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300 animate-pulse font-mono">
          ⚡ AI...
        </span>
      );
    }

    if (prediction?.error) {
      const canRetry =
        prediction.retryable && Date.now() - prediction.timestamp > 10000;

      return (
        <button
          onClick={() => canRetry && onLoadPrediction(contentId)}
          disabled={!canRetry}
          className={`text-xs px-2 py-1 rounded border font-mono transition ${
            prediction.isForbidden
              ? "bg-white text-gray-500 border-gray-300 cursor-not-allowed"
              : canRetry
                ? "bg-white text-black border-black hover:bg-black hover:text-white cursor-pointer"
                : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
          }`}
          title={
            prediction.isForbidden
              ? "AI Enhanced subscription required"
              : canRetry
                ? "Click to retry loading prediction"
                : `Wait ${Math.ceil(
                    (10000 - (Date.now() - prediction.timestamp)) / 1000,
                  )}s to retry`
          }
        >
          {prediction.isForbidden ? "🔒 AI" : canRetry ? "⟳ AI" : "⚠ AI"}
        </button>
      );
    }

    if (!prediction) return null;

    const probability = prediction.share_probability || 0;
    const shares = prediction.estimated_shares || 0;

    const getStyle = () => {
      if (probability >= 0.7) {
        return "bg-black text-white border-black"; // High: Black
      }
      if (probability >= 0.4) {
        return "bg-gray-600 text-white border-gray-600"; // Medium: Dark grey
      }
      return "bg-gray-300 text-gray-800 border-gray-300"; // Low: Light grey
    };

    const handleClick = () => {
      if (window.innerWidth < 768) {
        setMobilePredictionContent({ content, prediction });
        setIsMobilePredictionModalOpen(true);
      } else {
        setSelectedContentForAI({ content, prediction });
      }
    };

    return (
      <button
        onClick={handleClick}
        className={`text-xs px-2 py-1 rounded border font-mono cursor-pointer hover:opacity-80 transition ${getStyle()}`}
        title={`AI Prediction: ${Math.round(
          probability * 100,
        )}% success rate • Est. ${shares.toLocaleString()} shares`}
      >
        ⚡ AI {Math.round(probability * 100)}% • {shares.toLocaleString()}
      </button>
    );
  };

  const MobilePredictionModal = ({ isOpen, onClose, contentData }) => {
    if (!isOpen || !contentData) return null;

    const { content, prediction } = contentData;
    const probability = prediction.share_probability || 0;
    const shares = prediction.estimated_shares || 0;
    const timeline = prediction.estimated_timeline || "unknown";

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div className="relative w-full max-h-[80vh] bg-white rounded-t-2xl shadow-xl overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold">AI Insights</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            <div className="bg-gray-50 rounded p-2">
              <h4 className="text-xs font-bold text-gray-700 mb-1">Content</h4>
              <p className="text-sm text-gray-900 font-medium">
                {content.title}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded p-3 border border-purple-200">
              <div className="text-sm font-bold mb-2 flex items-center gap-2">
                <span>🤖</span>
                <span>ML Prediction</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Success Rate:</span>
                  <span className="font-bold text-purple-900">
                    {Math.round(probability * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Expected Shares:</span>
                  <span className="font-bold text-purple-900">{shares}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Timeline:</span>
                  <span className="font-bold text-purple-900">{timeline}</span>
                </div>
                <div className="pt-1.5 border-t border-purple-200 flex justify-between items-center">
                  <span className="text-gray-600 text-xs">Confidence:</span>
                  <span className="font-bold text-gray-800 text-xs">
                    {Math.round((prediction.confidence || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {prediction.success_factors &&
              prediction.success_factors.length > 0 && (
                <div className="bg-green-50 rounded p-2.5 border border-green-200">
                  <div className="text-sm font-bold text-green-800 mb-1.5 flex items-center gap-2">
                    <span>✅</span>
                    <span>Success Factors</span>
                  </div>
                  <ul className="space-y-1">
                    {prediction.success_factors.map((factor, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-green-700 flex items-start gap-2"
                      >
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {prediction.improvement_suggestions &&
              prediction.improvement_suggestions.length > 0 && (
                <div className="bg-blue-50 rounded p-2.5 border border-blue-200">
                  <div className="text-sm font-bold text-blue-800 mb-1.5 flex items-center gap-2">
                    <span>💡</span>
                    <span>Suggestions</span>
                  </div>
                  <ul className="space-y-1">
                    {prediction.improvement_suggestions.map(
                      (suggestion, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-blue-700 flex items-start gap-2"
                        >
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {prediction.risk_factors && prediction.risk_factors.length > 0 && (
              <div className="bg-red-50 rounded p-2.5 border border-red-200">
                <div className="text-sm font-bold text-red-800 mb-1.5 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Risk Factors</span>
                </div>
                <ul className="space-y-1">
                  {prediction.risk_factors.map((factor, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-red-700 flex items-start gap-2"
                    >
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-black text-white rounded font-bold text-sm hover:bg-gray-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AIInsightsPanel = ({ contentData, onClose }) => {
    if (!contentData) return null;

    const { content, prediction } = contentData;
    const probability = prediction.share_probability || 0;
    const shares = prediction.estimated_shares || 0;
    const timeline = prediction.estimated_timeline || "unknown";

    return (
      <div className="bg-white border border-gray-300 rounded p-3 h-fit sticky top-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center">
            <SparklesIcon className="h-4 w-4 mr-1.5" />
            AI Insights
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-1">Content</h4>
            <p
              className="text-xs text-gray-600 line-clamp-2"
              title={content.title}
            >
              {content.title}
            </p>
          </div>

          <div className="p-2.5 bg-gray-50 rounded">
            <div className="text-xs font-bold mb-1.5">🤖 ML Prediction</div>
            <div className="space-y-1 text-xs">
              <div>📊 Success Rate: {Math.round(probability * 100)}%</div>
              <div>🎯 Expected Shares: {shares}</div>
              <div>⏱️ Timeline: {timeline}</div>
              <div className="pt-1 border-t text-gray-600">
                Confidence: {Math.round((prediction.confidence || 0.5) * 100)}%
              </div>
            </div>
          </div>

          {prediction.success_factors &&
            prediction.success_factors.length > 0 && (
              <div>
                <div className="text-xs font-bold text-green-700 mb-1">
                  ✅ Success Factors
                </div>
                <div className="space-y-0.5">
                  {prediction.success_factors.map((factor, idx) => (
                    <div key={idx} className="text-xs text-green-600">
                      • {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {prediction.improvement_suggestions &&
            prediction.improvement_suggestions.length > 0 && (
              <div>
                <div className="text-xs font-bold text-blue-700 mb-1">
                  💡 Suggestions
                </div>
                <div className="space-y-0.5">
                  {prediction.improvement_suggestions.map((suggestion, idx) => (
                    <div key={idx} className="text-xs text-blue-600">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {prediction.risk_factors && prediction.risk_factors.length > 0 && (
            <div>
              <div className="text-xs font-bold text-red-700 mb-1">
                ⚠️ Risk Factors
              </div>
              <div className="space-y-0.5">
                {prediction.risk_factors.map((factor, idx) => (
                  <div key={idx} className="text-xs text-red-600">
                    • {factor}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="font-mono max-w-7xl mx-auto">
      {/* Context-aware feature info */}
      {!isPremium && !isAITier && (
        <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded max-w-2xl">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-1.5 text-blue-600" />
              <span>
                <strong>Unlock Premium Features:</strong> Get trackable links,
                advanced analytics, and AI-powered insights
              </span>
            </div>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openPremiumModal"))
              }
              className="ml-2 px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition text-xs font-bold whitespace-nowrap"
            >
              VIEW PLANS
            </button>
          </div>
        </div>
      )}

      {isPremium && !isAITier && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded max-w-2xl">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center flex-1">
              <ChartBarIcon className="h-4 w-4 mr-1.5 text-blue-600" />
              <span>
                <strong>Premium Active:</strong> Create trackable links below.
                <button
                  onClick={() => {
                    const event = new CustomEvent("openPremiumModal", {
                      detail: { tab: "ai" },
                    });
                    window.dispatchEvent(event);
                  }}
                  className="ml-1 text-purple-600 hover:text-purple-700 underline font-bold"
                >
                  Upgrade to AI Enhanced
                </button>{" "}
                for predictions.
              </span>
            </div>
          </div>
        </div>
      )}

      {isAITier && (
        <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded max-w-2xl">
          <div className="flex items-center text-xs">
            <SparklesIcon className="h-4 w-4 mr-1.5 text-purple-600" />
            <span>
              <strong>AI Enhanced Active:</strong> View predictions by clicking
              AI badges. Create trackable links for detailed analytics.
            </span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-3 max-w-2xl">
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-black"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded bg-white hover:border-black focus:outline-none focus:border-black"
          >
            <option value="all">📦 All Types</option>
            <option value="article">📰 Articles</option>
            <option value="video">🎬 Videos</option>
            <option value="image">🖼️ Images</option>
            <option value="pdf">📄 PDFs</option>
            <option value="audio">🎵 Audio</option>
            <option value="code">💻 Code</option>
          </select>

          <div className="ml-auto text-gray-600 py-1">
            {filteredContent.length} of {contentDetails.length} items
          </div>
        </div>
      </div>

      {/* Layout with Natural Empty Space */}
      <div className="flex gap-4">
        {/* Main Content List */}
        <div className="w-full max-w-3xl">
          {contentDetails.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm text-gray-700 mb-1">No content available</p>
              <p className="text-xs text-gray-500">
                Submit your first piece of content to get started
              </p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-gray-700 mb-1">
                No content matches your filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterAI("all");
                }}
                className="text-xs text-blue-600 hover:underline mt-2"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredContent.map((content) => {
                const requiredShares = content.required_shares || 5;
                const sharePercentage = Math.min(
                  (content.share_count / requiredShares) * 100,
                  100,
                );
                const hasLinks = (content.links || []).length > 0;
                const isProcessing = processingIds.has(content.id);

                const totalClicks = hasLinks
                  ? content.links.reduce(
                      (sum, link) => sum + (link.click_count || 0),
                      0,
                    )
                  : 0;

                const isExpanded = expandedItems.has(content.id);

                return (
                  <div
                    key={content.id}
                    className="bg-white border border-gray-300 rounded hover:shadow-sm transition"
                  >
                    {/* Compact Quick Stats Bar */}
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 px-2.5 py-1.5 bg-gray-50 border-b border-gray-200">
                      <button
                        onClick={() => toggleExpand(content.id)}
                        className="p-0.5 hover:bg-gray-200 rounded transition flex-shrink-0"
                        title={isExpanded ? "Less" : "More"}
                      >
                        {isExpanded ? (
                          <span className="text-xs font-semibold px-1">
                            Less
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-1">
                            More
                          </span>
                        )}
                      </button>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        📤 <strong>{content.share_count}</strong>
                      </span>
                      {content.view_count > 0 && (
                        <span className="flex items-center gap-1 flex-shrink-0">
                          👁️ <strong>{content.view_count}</strong>
                        </span>
                      )}
                      {totalClicks > 0 && (
                        <span className="flex items-center gap-1 flex-shrink-0">
                          🔗 <strong>{totalClicks}</strong>
                        </span>
                      )}

                      <ContentTypeBadge type={content.content_type} />

                      {isAITier && (
                        <MLInsightsBadge
                          contentId={content.id}
                          prediction={mlPredictions[content.id]}
                          isLoading={loadingPredictions.has(content.id)}
                          onLoadPrediction={getMLPrediction}
                          content={content}
                        />
                      )}

                      <div className="flex-1 min-w-0 px-2">
                        <div className="line-clamp-1 text-gray-900">
                          {content.title}
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          📅{" "}
                          {new Date(content.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>

                      {isAITier &&
                        mlPredictions[content.id] &&
                        !mlPredictions[content.id].error && (
                          <span className="text-purple-700 font-semibold flex-shrink-0">
                            🎯{" "}
                            {Math.round(
                              (mlPredictions[content.id].share_probability ||
                                0) * 100,
                            )}
                            %
                          </span>
                        )}
                    </div>
                    {isExpanded && (
                      <>
                        {/* Compact Header */}
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {content.title}
                                </h3>
                                {isAITier && (
                                  <MLInsightsBadge
                                    contentId={content.id}
                                    prediction={mlPredictions[content.id]}
                                    isLoading={loadingPredictions.has(
                                      content.id,
                                    )}
                                    onLoadPrediction={getMLPrediction}
                                    content={content}
                                  />
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                <time
                                  dateTime={new Date(
                                    content.created_at,
                                  ).toISOString()}
                                >
                                  {new Date(
                                    content.created_at,
                                  ).toLocaleDateString()}
                                </time>
                                {content.description && (
                                  <span className="ml-1.5">
                                    • {content.description.substring(0, 40)}...
                                  </span>
                                )}

                                {content.categories &&
                                  content.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {content.categories
                                        .slice(0, 3)
                                        .map((category, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                          >
                                            {category}
                                          </span>
                                        ))}
                                      {content.categories.length > 3 && (
                                        <span className="text-xs text-gray-500">
                                          +{content.categories.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 ml-2">
                              <ContentTypeBadge type={content.content_type} />
                              <StatusBadge status={content.status} />
                            </div>
                          </div>
                        </div>

                        {/* Compact Content */}
                        <div className="p-4">
                          {isPremium && content.url && (
                            <div className="text-xs mb-2 text-gray-600">
                              <span className="font-semibold">Original:</span>
                              <a
                                href={content.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-800 ml-1"
                                title={content.url}
                              >
                                {content.url.length > 35
                                  ? `${content.url.substring(0, 35)}...`
                                  : content.url}
                              </a>
                            </div>
                          )}

                          {/* Compact Progress Bar */}
                          <div className="mb-2">
                            <div className="w-full bg-gray-200 border border-gray-300 rounded h-1.5 overflow-hidden">
                              <div
                                className="bg-black h-full"
                                style={{ width: `${sharePercentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs mt-0.5">
                              {Math.round(sharePercentage)}% (
                              {content.share_count} / {requiredShares})
                              {content.view_count > 0 && (
                                <span className="text-gray-500 ml-2">
                                  • 👁️ {content.view_count}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Compact Trackable Links Section (Premium) */}
                          {/* Trackable Links Section - Shows for Premium & AI users */}
                          {isPremium && (
                            <div className="text-xs mb-2 p-2 border border-gray-300 rounded bg-gray-50">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold flex items-center">
                                  <EyeIcon className="h-3 w-3 mr-1" />
                                  Trackable Links
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {totalClicks > 0 && (
                                    <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                      {totalClicks} clicks
                                    </span>
                                  )}
                                  {hasLinks && (
                                    <span className="bg-gray-200 px-1.5 py-0.5 rounded-full">
                                      {content.links.length}
                                    </span>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (isProcessing) return;

                                      try {
                                        setProcessingIds((prev) =>
                                          new Set(prev).add(content.id),
                                        );
                                        toast.info(
                                          "Creating trackable link...",
                                        );

                                        console.log(
                                          "🔍 Content ID:",
                                          content.id,
                                        );
                                        console.log(
                                          "🔍 User is premium:",
                                          user?.is_premium,
                                        ); // Check user status

                                        const result = await enhanceLink(
                                          content.id,
                                        );
                                        console.log(
                                          "✅ Success result:",
                                          result,
                                        );

                                        // Refresh content details
                                        const updatedContent =
                                          await getContentDetails(content.id);
                                        setContentDetails((prev) =>
                                          prev.map((c) =>
                                            c.id === content.id
                                              ? updatedContent
                                              : c,
                                          ),
                                        );

                                        toast.success(
                                          "Trackable link created successfully!",
                                        );
                                      } catch (error) {
                                        console.error("❌ Full error:", error);
                                        console.error(
                                          "❌ Error status:",
                                          error.status,
                                        );
                                        console.error(
                                          "❌ Error message:",
                                          error.message,
                                        );
                                        console.error(
                                          "❌ Error details:",
                                          error.details,
                                        );

                                        if (error.status === 403) {
                                          toast.error(
                                            "Premium subscription required to create trackable links",
                                          );
                                        } else if (error.status === 429) {
                                          toast.error(
                                            "Too many requests. Please wait a moment.",
                                          );
                                        } else if (error.status === 404) {
                                          toast.error("Content not found");
                                        } else {
                                          toast.error(
                                            `Failed: ${error.message || "Unknown error"}`,
                                          );
                                        }
                                      } finally {
                                        setProcessingIds((prev) => {
                                          const newSet = new Set(prev);
                                          newSet.delete(content.id);
                                          return newSet;
                                        });
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className={`px-2 py-0.5 rounded border font-bold transition ${
                                      isProcessing
                                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                        : "bg-black text-white border-black hover:bg-white hover:text-black"
                                    }`}
                                  >
                                    {isProcessing ? "CREATING..." : "+ CREATE"}
                                  </button>
                                </div>
                              </div>

                              {hasLinks ? (
                                <>
                                  <div className="space-y-1 mt-1.5">
                                    {content.links.slice(0, 2).map((link) => (
                                      <div
                                        key={link.short_code}
                                        className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-300 hover:border-blue-400 transition"
                                      >
                                        <div className="flex-1 min-w-0 mr-2">
                                          <a
                                            href={`${window.location.origin}/links/${link.short_code}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-mono text-blue-600 hover:text-blue-800 truncate block"
                                            title={`${window.location.origin}/links/${link.short_code}`}
                                          >
                                            /links/{link.short_code}
                                          </a>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            Created{" "}
                                            {new Date(
                                              link.created_at,
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          <span
                                            className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-bold"
                                            title="Total anonymous clicks"
                                          >
                                            👆 {link.click_count || 0}
                                          </span>
                                          <button
                                            onClick={() => {
                                              const fullUrl = `${window.location.origin}/links/${link.short_code}`;
                                              copyToClipboard(fullUrl);
                                            }}
                                            className="p-1 rounded hover:bg-gray-200 transition"
                                            title="Copy trackable link"
                                          >
                                            <ClipboardIcon className="h-3.5 w-3.5 text-gray-600" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {content.links.length > 2 && (
                                      <div className="text-xs text-gray-500 text-center py-0.5">
                                        +{content.links.length - 2} more link
                                        {content.links.length > 3 ? "s" : ""}
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-1.5 p-1.5 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-xs text-blue-900 flex items-start gap-1">
                                      <span className="flex-shrink-0">💡</span>
                                      <span>
                                        <strong>Tip:</strong> Share these links
                                        in emails, social media, or messages to
                                        track engagement without collecting
                                        personal data.
                                      </span>
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div className="mt-1 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded p-2.5">
                                  <p className="text-xs text-blue-900 font-semibold mb-1.5 flex items-center gap-1">
                                    📊 Create a Trackable Link
                                  </p>
                                  <p className="text-xs text-blue-700 mb-1.5">
                                    Get a unique, shareable URL that counts how
                                    many times your content is clicked.
                                  </p>

                                  <div className="bg-white/60 rounded p-1.5 mb-1.5">
                                    <p className="text-xs font-semibold text-blue-900 mb-0.5">
                                      What You'll Track:
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-0.5 ml-3">
                                      <li>
                                        • <strong>Total clicks</strong> - See
                                        how popular your content is
                                      </li>
                                      <li>
                                        • <strong>Click trends</strong> -
                                        Monitor engagement over time
                                      </li>
                                      <li>
                                        • <strong>Anonymous metrics</strong> -
                                        Privacy-friendly analytics
                                      </li>
                                    </ul>
                                  </div>

                                  <div className="bg-purple-100/50 rounded p-1.5 border-l-2 border-purple-400 mb-2">
                                    <p className="text-xs text-purple-900 font-semibold">
                                      💡 <strong>Why use this?</strong>
                                    </p>
                                    <p className="text-xs text-purple-800 mt-0.5">
                                      Share the trackable link instead of your
                                      original URL to measure content
                                      performance without collecting personal
                                      data.
                                    </p>
                                  </div>

                                  <button
                                    onClick={async () => {
                                      if (isProcessing) return;

                                      try {
                                        setProcessingIds((prev) =>
                                          new Set(prev).add(content.id),
                                        );
                                        toast.info(
                                          "Creating trackable link...",
                                        );

                                        const result = await enhanceLink(
                                          content.id,
                                        );

                                        // Refresh content details to show new link
                                        const updatedContent =
                                          await getContentDetails(content.id);
                                        setContentDetails((prev) =>
                                          prev.map((c) =>
                                            c.id === content.id
                                              ? updatedContent
                                              : c,
                                          ),
                                        );

                                        toast.success(
                                          "Trackable link created successfully!",
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Failed to create trackable link:",
                                          error,
                                        );
                                        if (error.status === 403) {
                                          toast.error(
                                            "Premium subscription required",
                                          );
                                        } else if (error.status === 429) {
                                          toast.error(
                                            "Too many requests. Please wait a moment.",
                                          );
                                        } else {
                                          toast.error(
                                            "Failed to create trackable link",
                                          );
                                        }
                                      } finally {
                                        setProcessingIds((prev) => {
                                          const newSet = new Set(prev);
                                          newSet.delete(content.id);
                                          return newSet;
                                        });
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className={`w-full px-3 py-2 rounded border font-bold text-sm transition ${
                                      isProcessing
                                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                        : "bg-black text-white border-black hover:bg-white hover:text-black"
                                    }`}
                                  >
                                    {isProcessing
                                      ? "CREATING LINK..."
                                      : "CREATE TRACKABLE LINK"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="px-4 pb-4 flex gap-1.5 text-xs flex-wrap">
                          <button
                            onClick={() => handleEdit(content.id)}
                            className="px-2.5 py-1 border border-black bg-black text-white rounded hover:bg-white hover:text-black transition"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDeleteClick(content)}
                            className="px-2.5 py-1 border border-black bg-white text-black rounded hover:bg-black hover:text-white transition"
                          >
                            DELETE
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Insights Panel - Desktop Only */}
        {selectedContentForAI && (
          <div className="hidden md:block flex-1 max-w-sm">
            <AIInsightsPanel
              contentData={selectedContentForAI}
              onClose={() => setSelectedContentForAI(null)}
            />
          </div>
        )}

        {/* AI Instructions Placeholder - When AI not active but user has AI tier */}
        {!selectedContentForAI && isAITier && (
          <div className="hidden md:block flex-1 max-w-sm">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-200 rounded p-6 h-fit sticky top-4">
              <div className="text-center">
                <div className="text-5xl mb-3">⚡</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  AI Predictor Available
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Click the AI badge on any content item to view detailed
                  predictions
                </p>
                <div className="bg-white rounded-lg p-3 text-left space-y-2 border border-purple-100">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 text-lg">🎯</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        Success Rate
                      </p>
                      <p className="text-xs text-gray-600">
                        Predicted engagement probability
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 text-lg">💡</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        Optimization Tips
                      </p>
                      <p className="text-xs text-gray-600">
                        AI-powered improvement suggestions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">📊</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        Share Estimates
                      </p>
                      <p className="text-xs text-gray-600">
                        Expected shares and timeline
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Callout - Desktop Only (in empty space) */}
        {!isPremium && !selectedContentForAI && (
          <div className="hidden md:block flex-1 max-w-sm">
            <div className="bg-white border border-gray-300 rounded p-3 h-fit sticky top-4">
              <h4 className="text-sm font-bold mb-2">
                Upgrade for More Features
              </h4>
              <div className="space-y-2.5 text-xs">
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("openPremiumModal"))
                  }
                  className="w-full text-left p-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-blue-900 mb-1">
                    Premium ($15/mo)
                  </div>
                  <p className="text-blue-800">
                    Create trackable links for anonymous click analytics and
                    performance insights
                  </p>
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("openPremiumModal"))
                  }
                  className="w-full text-left p-2 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-purple-900 mb-1">
                    AI Enhanced ($20/mo)
                  </div>
                  <p className="text-purple-800">
                    AI-powered content quality scoring and optimization
                    recommendations
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Prediction Modal */}
      <MobilePredictionModal
        isOpen={isMobilePredictionModalOpen}
        onClose={() => {
          setIsMobilePredictionModalOpen(false);
          setMobilePredictionContent(null);
        }}
        contentData={mobilePredictionContent}
      />
    </div>
  );
};

ContentManagementTab.propTypes = {
  contentDetails: PropTypes.array.isRequired,
  handleEdit: PropTypes.func.isRequired,
  handleDeleteClick: PropTypes.func.isRequired,
  enhanceLink: PropTypes.func.isRequired,
  getContentDetails: PropTypes.func.isRequired,
  setContentDetails: PropTypes.func.isRequired,
  isPremium: PropTypes.bool.isRequired,
  isAITier: PropTypes.bool,
  onOpenPremiumModal: PropTypes.func, // ✅ ADD THIS
};

export default ContentManagementTab;
