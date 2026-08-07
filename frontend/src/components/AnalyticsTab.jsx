import React, { useState, useEffect, useMemo, Fragment } from "react";
import PropTypes from "prop-types";
import { ContentTypeBadge } from "./Badge";
import { useApi } from "../lib/api";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const scrollbarStyles = `
  .analytics-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .analytics-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .analytics-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .analytics-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }
`;

const AnalyticsTab = ({
  analyticsData: propAnalyticsData,
  contentData = [],
  isPremium = false,
}) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [sortBy, setSortBy] = useState("engagement");
  const [selectedContent, setSelectedContent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { getContentAnalytics } = useApi();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (propAnalyticsData) {
        setAnalyticsData(propAnalyticsData);
        return;
      }

      if (!contentData || contentData.length === 0) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const contentIds = contentData.map((content) => content.id);
        const analyticsResponse = await getContentAnalytics(contentIds);

        const transformedData = Object.entries(analyticsResponse).map(
          ([contentId, analytics]) => {
            const content = contentData.find(
              (c) => c.id === parseInt(contentId)
            );
            return {
              id: parseInt(contentId),
              title: content?.title || "Unknown",
              content_type: content?.content_type || "unknown",
              share_count: analytics.shares || 0,
              short_link_clicks: analytics.short_link_clicks ?? null,
              required_shares: content?.required_shares || 5,
              view_count: analytics.views || 0,
              conversions_count: analytics.conversions_count ?? null,
              created_at: content?.created_at,
              click_through_rate: analytics.click_through_rate ?? null,
              conversion_rate: analytics.conversion_rate ?? null,
              performance_score: analytics.performance_score ?? null,
              completion_rate: analytics.completion_rate || 0,
            };
          }
        );

        setAnalyticsData(transformedData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Failed to fetch analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [propAnalyticsData, contentData, getContentAnalytics]);

  const contentAnalytics = useMemo(() => {
    if (!analyticsData) return [];

    if (Array.isArray(analyticsData)) {
      return analyticsData;
    } else if (analyticsData && typeof analyticsData === "object") {
      return Object.values(analyticsData);
    }
    return [];
  }, [analyticsData]);

  const metrics = useMemo(() => {
    if (!contentAnalytics.length) return null;

    const validAnalytics = contentAnalytics.filter((item) => {
      if (!isPremium) {
        return item.share_count !== null && item.view_count !== null;
      }
      return true;
    });

    const totalShares = validAnalytics.reduce(
      (sum, item) => sum + (item.share_count || 0),
      0
    );

    const totalClicks = isPremium
      ? validAnalytics.reduce(
          (sum, item) => sum + (item.short_link_clicks || 0),
          0
        )
      : null;

    const totalViews = validAnalytics.reduce(
      (sum, item) => sum + (item.view_count || 0),
      0
    );

    const totalConversions = isPremium
      ? validAnalytics.reduce(
          (sum, item) => sum + (item.conversions_count || 0),
          0
        )
      : null;

    const completedContent = validAnalytics.filter(
      (item) => (item.share_count || 0) >= (item.required_shares || 5)
    ).length;

    const completionRate =
      validAnalytics.length > 0
        ? (completedContent / validAnalytics.length) * 100
        : 0;

    let avgCTR = null;
    if (isPremium && totalViews > 0 && totalClicks !== null) {
      avgCTR = (totalClicks / totalViews) * 100;
    }

    let avgConversionRate = null;
    if (
      isPremium &&
      totalClicks !== null &&
      totalClicks > 0 &&
      totalConversions !== null
    ) {
      avgConversionRate = (totalConversions / totalClicks) * 100;
    }

    return {
      totalShares,
      totalClicks,
      totalViews,
      totalConversions,
      completionRate,
      avgCTR,
      avgConversionRate,
    };
  }, [contentAnalytics, isPremium]);

  const getProgress = (shares, required) =>
    Math.min(((shares || 0) / (required || 5)) * 100, 100);

  const getSortedContent = (content, sortMethod) => {
    const sorted = [...content];

    switch (sortMethod) {
      case "shares":
        return sorted.sort(
          (a, b) => (b.share_count || 0) - (a.share_count || 0)
        );
      case "clicks":
        return sorted.sort(
          (a, b) => (b.short_link_clicks || 0) - (a.short_link_clicks || 0)
        );
      case "date":
        return sorted.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      case "ctr":
        return sorted.sort(
          (a, b) => (b.click_through_rate || 0) - (a.click_through_rate || 0)
        );
      case "engagement":
      default:
        return sorted.sort((a, b) => {
          const scoreA =
            (a.share_count || 0) + (a.short_link_clicks || 0) * 0.5;
          const scoreB =
            (b.share_count || 0) + (b.short_link_clicks || 0) * 0.5;
          return scoreB - scoreA;
        });
    }
  };

  const sortedContent = useMemo(
    () => getSortedContent(contentAnalytics, sortBy),
    [contentAnalytics, sortBy]
  );

  const totalPages = Math.ceil(sortedContent.length / itemsPerPage);
  const paginatedContent = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedContent.slice(startIndex, endIndex);
  }, [sortedContent, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, viewMode]);

  if (loading) {
    return (
      <div className="space-y-3 font-mono">
        <style>{scrollbarStyles}</style>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
            Loading Analytics
          </label>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
            <div className="text-xl mb-1">⏳</div>
            <h3 className="font-bold text-sm mb-1">Loading Analytics...</h3>
            <p className="text-xs text-gray-600">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 font-mono">
        <style>{scrollbarStyles}</style>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
            Error
          </label>
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm leading-relaxed text-red-600">
            <div className="text-center">
              <div className="text-xl mb-1">❌</div>
              <h3 className="font-bold text-sm mb-1">
                Error Loading Analytics
              </h3>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contentAnalytics.length) {
    return (
      <div className="space-y-3 font-mono">
        <style>{scrollbarStyles}</style>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
            Analytics Dashboard
          </label>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
            <div className="text-xl mb-1">📊</div>
            <h3 className="font-bold text-sm mb-1">No Analytics Data</h3>
            <p className="text-xs text-gray-600">
              Submit content to see analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      <style>{scrollbarStyles}</style>

      {/* Compact Performance Overview */}
      {metrics && (
        <div>
          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
            Performance Overview
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">📤</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded">
                  SHARES
                </span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {metrics.totalShares}
              </div>
              <div className="text-xs text-blue-700">Total Shares</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded p-2.5">
              {isPremium ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">👆</span>
                    <span className="text-xs font-bold text-green-700 bg-green-200 px-1.5 py-0.5 rounded">
                      CLICKS
                    </span>
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    {metrics.totalClicks}
                  </div>
                  <div className="text-xs text-green-700">Total Clicks</div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-1.5">
                  <div className="text-2xl mb-1">🔒</div>
                  <div className="text-xs font-bold text-gray-700 text-center">
                    TOTAL CLICKS
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-0.5">
                    Premium Only
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">👁️</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-200 px-1.5 py-0.5 rounded">
                  VIEWS
                </span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {metrics.totalViews}
              </div>
              <div className="text-xs text-purple-700">Total Views</div>
            </div>

            <div
              className={`bg-gradient-to-br ${
                metrics.completionRate >= 70
                  ? "from-green-50 to-green-100 border-green-200"
                  : metrics.completionRate >= 50
                  ? "from-yellow-50 to-yellow-100 border-yellow-200"
                  : "from-red-50 to-red-100 border-red-200"
              } border rounded p-2.5`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">🎯</span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    metrics.completionRate >= 70
                      ? "text-green-700 bg-green-200"
                      : metrics.completionRate >= 50
                      ? "text-yellow-700 bg-yellow-200"
                      : "text-red-700 bg-red-200"
                  }`}
                >
                  RATE
                </span>
              </div>
              <div
                className={`text-xl font-bold ${
                  metrics.completionRate >= 70
                    ? "text-green-900"
                    : metrics.completionRate >= 50
                    ? "text-yellow-900"
                    : "text-red-900"
                }`}
              >
                {Math.round(metrics.completionRate)}%
              </div>
              <div
                className={`text-xs ${
                  metrics.completionRate >= 70
                    ? "text-green-700"
                    : metrics.completionRate >= 50
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}
              >
                Completion Rate
              </div>
            </div>
          </div>

          {/* Compact Secondary Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
            <div className="bg-white border border-gray-300 rounded p-2">
              {isPremium && metrics.avgCTR != null ? (
                <>
                  <div className="text-xs text-gray-600">AVG CTR</div>
                  <div className="text-base font-bold text-gray-900">
                    {metrics.avgCTR.toFixed(1)}%
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-1">
                  <div className="text-xl mb-0.5">🔒</div>
                  <div className="text-xs font-bold text-gray-700 text-center">
                    AVG CTR
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Premium Only
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-300 rounded p-2">
              {isPremium && metrics.totalConversions != null ? (
                <>
                  <div className="text-xs text-gray-600">CONVERSIONS</div>
                  <div className="text-base font-bold text-gray-900">
                    {metrics.totalConversions}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-1">
                  <div className="text-xl mb-0.5">🔒</div>
                  <div className="text-xs font-bold text-gray-700 text-center">
                    CONVERSIONS
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Premium Only
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-300 rounded p-2">
              <div className="text-xs text-gray-600">TOTAL CONTENT</div>
              <div className="text-base font-bold text-gray-900">
                {contentAnalytics.length}
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded p-2">
              {isPremium ? (
                <>
                  <div className="text-xs text-gray-600">ENGAGEMENT</div>
                  <div className="text-base font-bold text-gray-900">
                    {Math.round(
                      ((metrics.totalShares || 0) +
                        (metrics.totalClicks || 0)) /
                        contentAnalytics.length
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-1">
                  <div className="text-xl mb-0.5">🔒</div>
                  <div className="text-xs font-bold text-gray-700 text-center">
                    ENGAGEMENT
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Premium Only
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact View Toggle and Sort Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <label className="block text-xs font-bold uppercase text-gray-600">
          Content Performance ({sortedContent.length})
        </label>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "cards"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              📱 CARDS
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "table"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              📊 TABLE
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold border border-gray-300 rounded bg-white hover:bg-gray-50 transition"
          >
            <option value="engagement">🔥 Engagement</option>
            <option value="shares">📤 Shares</option>
            <option value="clicks">👆 Clicks</option>
            <option value="ctr">📊 Click Rate</option>
            <option value="date">📅 Date</option>
          </select>
        </div>
      </div>

      {/* Compact Card View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {paginatedContent.map((data, idx) => {
            const progress = getProgress(
              data.share_count,
              data.required_shares
            );

            return (
              <div
                key={data.id || idx}
                className="bg-white border border-gray-300 rounded p-2.5 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedContent(data)}
              >
                {/* Compact Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-900 line-clamp-1 flex-1 pr-1">
                    {data.title || "Untitled"}
                  </h3>
                  <ContentTypeBadge type={data.content_type} />
                </div>

                {/* Compact Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-bold">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 bg-black transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Compact Stats Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-blue-50 rounded p-1.5">
                    <div className="text-sm font-bold text-blue-900">
                      {data.share_count || 0}
                    </div>
                    <div className="text-xs text-blue-700">Shares</div>
                  </div>
                  <div className="bg-green-50 rounded p-1.5">
                    <div className="text-sm font-bold text-green-900">
                      {isPremium ? data.short_link_clicks || 0 : "🔒"}
                    </div>
                    <div className="text-xs text-green-700">Clicks</div>
                  </div>
                  <div className="bg-purple-50 rounded p-1.5">
                    <div className="text-sm font-bold text-purple-900">
                      {data.view_count || 0}
                    </div>
                    <div className="text-xs text-purple-700">Views</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="p-2 bg-gray-50 border border-gray-200 rounded">
          <div className="overflow-auto border border-gray-300 rounded analytics-scroll bg-white max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-black text-white">
                  <th className="px-2 py-1.5 text-left font-bold">Title</th>
                  <th className="px-2 py-1.5 text-left font-bold">Type</th>
                  <th className="px-2 py-1.5 text-center font-bold">Shares</th>
                  <th className="px-2 py-1.5 text-center font-bold">
                    Progress
                  </th>
                  <th className="px-2 py-1.5 text-center font-bold">Clicks</th>
                  <th className="px-2 py-1.5 text-center font-bold">Views</th>
                  <th className="px-2 py-1.5 text-center font-bold">
                    CTR {!isPremium && "🔒"}
                  </th>
                  <th className="px-2 py-1.5 text-center font-bold">
                    Conv {!isPremium && "🔒"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedContent.map((data, idx) => {
                  const progress = getProgress(
                    data.share_count,
                    data.required_shares
                  );

                  return (
                    <tr
                      key={data.id || idx}
                      className={`${
                        idx % 2 ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100 cursor-pointer`}
                      onClick={() => setSelectedContent(data)}
                    >
                      <td className="px-2 py-1.5">
                        <div
                          className="truncate max-w-32 font-medium"
                          title={data.title}
                        >
                          {data.title || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <ContentTypeBadge type={data.content_type} />
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold">
                        {data.share_count || 0}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-black h-1.5 transition-all duration-300"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold">
                        {isPremium ? data.short_link_clicks || 0 : "🔒"}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold">
                        {data.view_count || 0}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold">
                        {isPremium && data.click_through_rate != null
                          ? `${data.click_through_rate.toFixed(1)}%`
                          : "🔒"}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold">
                        {isPremium && data.conversions_count != null
                          ? data.conversions_count
                          : "🔒"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, sortedContent.length)} of{" "}
            {sortedContent.length}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 text-xs font-bold border border-gray-300 rounded transition ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 py-1 text-xs font-bold border rounded transition ${
                          currentPage === page
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-1 text-gray-400 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-2.5 py-1 text-xs font-bold border border-gray-300 rounded transition ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Content Detail Modal */}
      <Transition.Root show={!!selectedContent} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-mono"
          onClose={() => setSelectedContent(null)}
        >
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
                  {selectedContent && (
                    <>
                      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-gray-50">
                        <Dialog.Title className="text-base font-bold uppercase">
                          Content Analytics
                        </Dialog.Title>
                        <button
                          type="button"
                          onClick={() => setSelectedContent(null)}
                          className="p-1.5 rounded border border-black hover:bg-black hover:text-white transition"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="px-4 py-4 space-y-3 max-h-96 overflow-y-auto analytics-scroll">
                        <div>
                          <h4 className="text-xs font-bold text-gray-600 mb-1">
                            TITLE
                          </h4>
                          <p className="text-sm font-bold">
                            {selectedContent.title}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-600 mb-1">
                            TYPE
                          </h4>
                          <ContentTypeBadge
                            type={selectedContent.content_type}
                          />
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-600 mb-2">
                            PERFORMANCE METRICS
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <div className="text-xl font-bold text-blue-900">
                                {selectedContent.share_count || 0}
                              </div>
                              <div className="text-xs text-blue-700">
                                Times Shared by Others
                              </div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                              <div className="text-xl font-bold text-green-900">
                                {isPremium
                                  ? selectedContent.short_link_clicks || 0
                                  : "🔒"}
                              </div>
                              <div className="text-xs text-green-700">
                                Link Clicks
                              </div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded p-2">
                              <div className="text-xl font-bold text-purple-900">
                                {selectedContent.view_count || 0}
                              </div>
                              <div className="text-xs text-purple-700">
                                Total Views
                              </div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded p-2">
                              <div className="text-xl font-bold text-gray-900">
                                {Math.round(
                                  getProgress(
                                    selectedContent.share_count,
                                    selectedContent.required_shares
                                  )
                                )}
                                %
                              </div>
                              <div className="text-xs text-gray-700">
                                Progress
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-600 mb-2">
                            ENGAGEMENT METRICS
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Click-Through Rate */}
                            <div className="bg-white border border-gray-300 rounded p-2 relative">
                              {!isPremium ? (
                                <div className="flex flex-col items-center justify-center h-full py-2">
                                  <div className="text-2xl mb-1">🔒</div>
                                  <div className="text-xs font-bold text-gray-700 text-center">
                                    CLICK-THROUGH RATE
                                  </div>
                                  <div className="text-xs text-gray-500 text-center mt-1">
                                    Premium Only
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-xs text-gray-600 mb-1">
                                    CLICK-THROUGH RATE
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {selectedContent.click_through_rate != null
                                      ? `${selectedContent.click_through_rate.toFixed(
                                          1
                                        )}%`
                                      : "N/A"}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {selectedContent.short_link_clicks || 0} /{" "}
                                    {selectedContent.view_count || 0} views
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Conversions */}
                            <div className="bg-white border border-gray-300 rounded p-2 relative">
                              {!isPremium ? (
                                <div className="flex flex-col items-center justify-center h-full py-2">
                                  <div className="text-2xl mb-1">🔒</div>
                                  <div className="text-xs font-bold text-gray-700 text-center">
                                    CONVERSIONS
                                  </div>
                                  <div className="text-xs text-gray-500 text-center mt-1">
                                    Premium Only
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-xs text-gray-600 mb-1">
                                    CONVERSIONS
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {selectedContent.conversions_count ?? 0}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {selectedContent.conversion_rate != null
                                      ? `${selectedContent.conversion_rate.toFixed(
                                          1
                                        )}% rate`
                                      : "Rate: Calculating..."}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-600 mb-1.5">
                            COMPLETION
                          </h4>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-2.5 bg-black transition-all duration-300"
                              style={{
                                width: `${getProgress(
                                  selectedContent.share_count,
                                  selectedContent.required_shares
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
                        <span className="text-xs text-gray-500">
                          Click outside or press ESC to close
                        </span>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Performance Tip */}
      {metrics && metrics.completionRate < 50 && (
        <div>
          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
            Performance Tip
          </label>
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs leading-relaxed text-blue-700">
            <div className="flex items-start">
              <span className="mr-2">💡</span>
              <div>
                <strong>Improve Your Completion Rate:</strong> Share others'
                content to get more shares back. Aim for at least 70% completion
                rate for optimal performance.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AnalyticsTab.propTypes = {
  analyticsData: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  contentData: PropTypes.array,
  isPremium: PropTypes.bool,
};

export default AnalyticsTab;
