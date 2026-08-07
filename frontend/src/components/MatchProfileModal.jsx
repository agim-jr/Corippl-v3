// frontend/src/components/MatchProfileModal.jsx

"use client";
import React, { Fragment, useEffect, useState, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import { useApi } from "../lib/api";
import { SOCIAL_PLATFORMS } from "../lib/constants";

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-2 bg-gray-200 rounded"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

const MatchProfileModal = ({ isOpen, onClose, user }) => {
  const { getUserAnalytics, getProfile } = useApi();
  const [profileData, setProfileData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [errorProfile, setErrorProfile] = useState(null);
  const [errorAnalytics, setErrorAnalytics] = useState(null);
  const [profileCache, setProfileCache] = useState(new Map());
  const [analyticsCache, setAnalyticsCache] = useState(new Map());

  // Validate user data
  const isValidUser = useMemo(() => {
    return (
      user &&
      typeof user.id === "number" &&
      typeof user.username === "string" &&
      user.username.trim().length > 0
    );
  }, [user]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isValidUser || !isOpen) return;

      // Check cache first
      if (profileCache.has(user.id)) {
        setProfileData(profileCache.get(user.id));
        return;
      }

      setLoadingProfile(true);
      setErrorProfile(null);

      try {
        const data = await getProfile(user.id);
        const profile = data.profile || {};
        setProfileData(profile);

        // Cache the result for 5 minutes
        setProfileCache((prev) => new Map(prev.set(user.id, profile)));
        setTimeout(
          () => {
            setProfileCache((prev) => {
              const newCache = new Map(prev);
              newCache.delete(user.id);
              return newCache;
            });
          },
          5 * 60 * 1000,
        );
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setErrorProfile(
          error.message || "Failed to fetch profile. Please try again later.",
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [isOpen, user?.id, getProfile, isValidUser, profileCache]);

  // Memoize unique categories
  const uniqueCategories = useMemo(() => {
    if (!Array.isArray(profileData?.categories)) return [];
    return Object.values(
      profileData.categories.reduce((acc, cat) => {
        if (typeof cat !== "string") return acc;
        const normalized = cat.trim().toLowerCase();
        if (!acc[normalized] && cat.trim().length > 0) {
          acc[normalized] = cat.trim();
        }
        return acc;
      }, {}),
    );
  }, [profileData?.categories]);

  // Memoize unique interests
  const uniqueInterests = useMemo(() => {
    if (!Array.isArray(profileData?.interests)) return [];
    return Object.values(
      profileData.interests.reduce((acc, interest) => {
        if (typeof interest !== "string") return acc;
        const normalized = interest.trim().toLowerCase();
        if (!acc[normalized] && interest.trim().length > 0) {
          acc[normalized] = interest.trim();
        }
        return acc;
      }, {}),
    );
  }, [profileData?.interests]);

  // Calculate share rate safely
  const shareRate = useMemo(() => {
    if (
      !analytics ||
      !analytics.total_content_shares ||
      analytics.total_content_shares === 0
    ) {
      return "0.00";
    }
    const rate =
      (analytics.successful_cross_promotions / analytics.total_content_shares) *
      100;
    return Math.max(0, Math.min(100, rate)).toFixed(2);
  }, [analytics]);

  // Normalize audience score
  const normalizedAudienceScore = useMemo(() => {
    if (!analytics || typeof analytics.audience_score !== "number") {
      return null;
    }
    return Math.max(0, Math.min(100, analytics.audience_score));
  }, [analytics]);

  // Fetch analytics
  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isValidUser || !isOpen) return;

      // Check cache first
      if (analyticsCache.has(user.id)) {
        setAnalytics(analyticsCache.get(user.id));
        return;
      }

      setLoadingAnalytics(true);
      setErrorAnalytics(null);

      try {
        const data = await getUserAnalytics(user.id);

        // Validate analytics data
        const validatedData = {
          audience_score:
            typeof data.audience_score === "number"
              ? data.audience_score
              : null,
          total_content_shares: Math.max(
            0,
            parseInt(data.total_content_shares) || 0,
          ),
          successful_cross_promotions: Math.max(
            0,
            parseInt(data.successful_cross_promotions) || 0,
          ),
          ...data,
        };

        setAnalytics(validatedData);

        // Cache the result for 5 minutes
        setAnalyticsCache((prev) => new Map(prev.set(user.id, validatedData)));
        setTimeout(
          () => {
            setAnalyticsCache((prev) => {
              const newCache = new Map(prev);
              newCache.delete(user.id);
              return newCache;
            });
          },
          5 * 60 * 1000,
        );
      } catch (error) {
        console.error("Failed to fetch analytics:", error);

        // If it's a 404, it just means no analytics data exists yet
        // Set default analytics instead of showing an error
        if (
          error.message?.includes("404") ||
          error.message?.includes("not found")
        ) {
          const defaultAnalytics = {
            audience_score: null,
            total_content_shares: 0,
            successful_cross_promotions: 0,
          };
          setAnalytics(defaultAnalytics);

          // Cache the default data
          setAnalyticsCache(
            (prev) => new Map(prev.set(user.id, defaultAnalytics)),
          );
          setTimeout(
            () => {
              setAnalyticsCache((prev) => {
                const newCache = new Map(prev);
                newCache.delete(user.id);
                return newCache;
              });
            },
            5 * 60 * 1000,
          );
        } else {
          // For other errors, show the error message
          setErrorAnalytics(
            error.message ||
              "Failed to fetch analytics. Please try again later.",
          );
        }
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [isOpen, user?.id, getUserAnalytics, isValidUser, analyticsCache]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrorProfile(null);
      setErrorAnalytics(null);
    }
  }, [isOpen]);

  if (!isValidUser) {
    return null;
  }

  // Check what data we have
  const hasName = Boolean(profileData?.name);
  const hasBio = Boolean(profileData?.bio);
  const hasCategories = uniqueCategories.length > 0;
  const hasContentType = Boolean(profileData?.content_type);
  const hasInterests = uniqueInterests.length > 0;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-mono"
        onClose={onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
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
                  <div className="flex items-center gap-4">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={`${user.username}'s avatar`}
                        className="w-10 h-10 rounded-full border border-black object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <Dialog.Title
                      id="modal-title"
                      className="text-lg font-bold uppercase"
                    >
                      {user.username}
                    </Dialog.Title>
                  </div>
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
                  {loadingProfile ? (
                    <SkeletonLoader />
                  ) : errorProfile ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600">{errorProfile}</p>
                    </div>
                  ) : (
                    <>
                      {/* Profile Info Grid */}
                      {(hasName || hasBio || hasContentType) && (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Name */}
                          {hasName && (
                            <div>
                              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                                Name
                              </label>
                              <span className="text-sm font-bold">
                                {profileData.name}
                              </span>
                            </div>
                          )}

                          {/* Content Type */}
                          {hasContentType && (
                            <div>
                              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                                Content Type
                              </label>
                              <span className="text-sm font-bold">
                                {profileData.content_type
                                  .charAt(0)
                                  .toUpperCase() +
                                  profileData.content_type.slice(1)}
                              </span>
                            </div>
                          )}

                          {/* Bio - spans full width if present */}
                          {hasBio && (
                            <div className="col-span-2">
                              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                                Bio
                              </label>
                              <p className="text-sm whitespace-pre-wrap">
                                {profileData.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Categories */}
                      {hasCategories && (
                        <div
                          className={
                            hasName || hasBio || hasContentType
                              ? "pt-4 border-t border-gray-200"
                              : ""
                          }
                        >
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                            Categories
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {uniqueCategories.map((cat) => (
                              <span
                                key={cat}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded"
                              >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interests */}
                      {hasInterests && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                            Interests
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {uniqueInterests.map((interest) => (
                              <span
                                key={interest}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No profile message */}
                      {!hasName &&
                        !hasBio &&
                        !hasCategories &&
                        !hasContentType &&
                        !hasInterests && (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
                            <p className="text-sm text-gray-500">
                              This user hasn't completed their profile yet.
                            </p>
                          </div>
                        )}
                    </>
                  )}

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Total Shares
                      </label>
                      <span className="text-sm font-bold">
                        {(user.share_count || 0).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Profile Views
                      </label>
                      <span className="text-sm font-bold">
                        {(user.view_count || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {profileData?.social_links &&
                    Object.keys(profileData.social_links).length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Social Media
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(profileData.social_links).map(
                            ([platform, url]) => {
                              if (!url) return null;
                              const platformInfo = SOCIAL_PLATFORMS.find(
                                (p) => p.key === platform,
                              );
                              return (
                                <a
                                  key={platform}
                                  href={
                                    url.startsWith("http")
                                      ? url
                                      : `https://${url}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition"
                                >
                                  <span className="text-sm">
                                    {platformInfo?.icon || "🔗"}
                                  </span>
                                  {platformInfo?.label || platform}
                                </a>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                  {/* Analytics Section */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                      Performance Analytics
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      {loadingAnalytics ? (
                        <SkeletonLoader />
                      ) : errorAnalytics ? (
                        <div className="text-sm text-red-600">
                          {errorAnalytics}
                        </div>
                      ) : analytics ? (
                        <div className="space-y-3">
                          {/* Audience Score */}
                          {normalizedAudienceScore !== null && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Audience Score</span>
                                <span className="font-bold">
                                  {normalizedAudienceScore.toFixed(1)}/100
                                </span>
                              </div>
                              <div className="w-full bg-white border border-gray-300 rounded h-2 overflow-hidden">
                                <div
                                  className="h-full bg-black transition-all duration-300"
                                  style={{
                                    width: `${normalizedAudienceScore}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Analytics Grid */}
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <span className="text-xs text-gray-600">
                                Content Shares
                              </span>
                              <div className="text-sm font-bold">
                                {analytics.total_content_shares.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">
                                Cross-Promotions
                              </span>
                              <div className="text-sm font-bold">
                                {analytics.successful_cross_promotions.toLocaleString()}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-xs text-gray-600">
                                Success Rate
                              </span>
                              <div className="text-sm font-bold">
                                {shareRate}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No analytics data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <span className="text-xs text-gray-500">
                    Click outside or press ESC to close
                  </span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

MatchProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    share_count: PropTypes.number,
    view_count: PropTypes.number,
    avatar_url: PropTypes.string,
  }).isRequired,
};

export default MatchProfileModal;
