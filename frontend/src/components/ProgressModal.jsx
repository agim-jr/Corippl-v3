// frontend/src/components/ProgressModal.jsx

import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useApi } from "../lib/api";
import AnimatedProgressBar from "./AnimatedProgressBar";

// Custom Scrollbar styles
const scrollbarStyles = `
  .progress-modal-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .progress-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .progress-modal-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .progress-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }
`;

// Animated Credit Display Component
const AnimatedCreditDisplay = ({ credits }) => {
  const [prevCredits, setPrevCredits] = useState(credits);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showChange, setShowChange] = useState(null);

  useEffect(() => {
    if (credits !== prevCredits) {
      const change = credits - prevCredits;
      setShowChange(change);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowChange(null);
        setPrevCredits(credits);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [credits, prevCredits]);

  return (
    <div className="relative inline-block">
      <div
        className={`text-3xl font-bold transition-all duration-300 ${
          isAnimating ? "scale-110 text-green-600" : "text-gray-900"
        }`}
      >
        💰 {credits}
      </div>

      {showChange !== null && (
        <div
          className={`absolute -top-2 -right-2 text-sm font-bold animate-bounce ${
            showChange > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {showChange > 0 ? "+" : ""}
          {showChange}
        </div>
      )}
    </div>
  );
};

const ProgressModal = ({ isOpen, onClose }) => {
  const { getUserProgress } = useApi();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchProgress();
    }
  }, [isOpen]);

  const fetchProgress = async () => {
    try {
      const data = await getUserProgress();
      console.log("📊 Progress Modal - received data:", data);
      setProgress(data);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
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
                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                  <div className="p-8 text-center">
                    <div className="text-lg font-mono text-gray-600">
                      Loading your progress...
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  if (!progress) return null;

  const { content, shares, daily_limit, milestones, user_tier, queue } =
    progress;

  const contentProgress =
    content.total > 0 ? (content.active / content.total) * 100 : 0;
  const shareProgress = daily_limit.is_premium
    ? 100
    : (daily_limit.used / daily_limit.limit) * 100;

  const shareCredits = queue?.share_credits || 0;
  const pendingItems = Array.isArray(queue?.queue_items)
    ? queue.queue_items
    : [];
  const nextToUnlock = pendingItems.find((item) => item?.status === "pending");
  const hasPendingContent = pendingItems.length > 0;

  const actualShareCredits = Math.max(0, shares.balance);
  const hasShareCredits = actualShareCredits > 0;

  const hasContent = content.total > 0;
  const allContentActive = content.pending === 0 && hasContent;

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
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    <div>
                      <Dialog.Title className="text-lg font-bold uppercase tracking-wider text-gray-900">
                        Your Progress Dashboard
                      </Dialog.Title>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-black text-white px-2 py-1 rounded font-bold">
                          {user_tier}
                        </span>
                        {hasShareCredits && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-bold">
                            💰 {actualShareCredits} Credits
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded border border-black hover:bg-black hover:text-white transition"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto progress-modal-scroll">
                  {/* Status Banner */}
                  {hasPendingContent && nextToUnlock && hasShareCredits && (
                    <div className="p-6 bg-green-50 border-2 border-green-500 rounded">
                      <div className="flex items-start gap-4">
                        <AnimatedCreditDisplay credits={actualShareCredits} />
                        <div className="flex-1">
                          <div className="text-lg font-bold text-green-900 mb-3">
                            🎉 Ready to Unlock!
                          </div>

                          <div className="p-4 bg-white rounded border border-green-200">
                            <div className="text-sm font-bold text-gray-900 mb-2">
                              "{nextToUnlock.title}"
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <span>
                                📅{" "}
                                {new Date(
                                  nextToUnlock.created_at,
                                ).toLocaleDateString()}
                              </span>
                              <span>📍 Position #1 in Queue</span>
                            </div>
                          </div>

                          <div className="mt-4 text-sm text-green-800 font-medium bg-green-100 p-3 rounded">
                            ✅ This content will unlock automatically with your
                            next share!
                          </div>

                          {pendingItems.length > 1 && (
                            <div className="mt-3 text-sm text-green-700 font-medium">
                              📋 {pendingItems.length - 1} more item
                              {pendingItems.length - 1 === 1 ? "" : "s"} waiting
                              in queue
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {hasPendingContent && nextToUnlock && !hasShareCredits && (
                    <div className="p-6 bg-blue-50 border-2 border-blue-500 rounded">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">🎯</span>
                        <div className="flex-1">
                          <div className="text-lg font-bold text-blue-900 mb-3">
                            Next Content to Unlock
                          </div>

                          <div className="p-4 bg-white rounded border border-blue-200">
                            <div className="text-sm font-bold text-gray-900 mb-2">
                              "{nextToUnlock.title}"
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <span>
                                📅{" "}
                                {new Date(
                                  nextToUnlock.created_at,
                                ).toLocaleDateString()}
                              </span>
                              <span>📍 Position #1 in Queue</span>
                            </div>
                          </div>

                          <div className="mt-4 text-sm text-blue-800 bg-blue-100 p-3 rounded">
                            💡 Share matched content to earn 1 credit and unlock
                            this item
                          </div>

                          {pendingItems.length > 1 && (
                            <div className="mt-3 text-sm text-blue-700 font-medium">
                              📋 {pendingItems.length - 1} more item
                              {pendingItems.length - 1 === 1 ? "" : "s"} waiting
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {allContentActive && hasShareCredits && (
                    <div className="p-6 bg-purple-50 border-2 border-purple-500 rounded">
                      <div className="flex items-start gap-4">
                        <AnimatedCreditDisplay credits={actualShareCredits} />
                        <div className="flex-1">
                          <div className="text-lg font-bold text-purple-900 mb-2">
                            💎 Credits Banked!
                          </div>
                          <div className="text-sm text-purple-800 mb-3">
                            All your content is live and active. These{" "}
                            {actualShareCredits} credit
                            {actualShareCredits === 1 ? "" : "s"} will unlock
                            your next submission instantly!
                          </div>
                          <div className="text-sm text-purple-700 bg-purple-100 p-3 rounded">
                            💡 You've given <strong>{shares.given}</strong>{" "}
                            share
                            {shares.given === 1 ? "" : "s"} and received{" "}
                            <strong>{shares.received}</strong>. The difference
                            is your credit balance!
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {allContentActive && !hasShareCredits && (
                    <div className="p-6 bg-green-50 border-2 border-green-500 rounded">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">✅</span>
                        <div className="flex-1">
                          <div className="text-lg font-bold text-green-900 mb-2">
                            All Content is Live!
                          </div>
                          <div className="text-sm text-green-800 mb-2">
                            Excellent! All your content is active and visible to
                            others.
                          </div>
                          <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                            💡 Keep sharing to earn credits for future
                            submissions
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasContent && (
                    <div className="p-6 bg-yellow-50 border-2 border-yellow-500 rounded">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">🚀</span>
                        <div className="flex-1">
                          <div className="text-lg font-bold text-yellow-900 mb-2">
                            Ready to Get Started?
                          </div>
                          <div className="text-sm text-yellow-800 mb-2">
                            Add your first content to begin your journey!
                          </div>
                          {hasShareCredits && (
                            <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded">
                              💰 You have {actualShareCredits} credit
                              {actualShareCredits === 1 ? "" : "s"} ready to use
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Content Stats */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase text-gray-600 border-b border-gray-200 pb-2">
                        📝 Content Statistics
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 p-4 rounded border border-gray-300 text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {content.total}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Total
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded border border-green-300 text-center">
                          <div className="text-2xl font-bold text-green-700">
                            {content.active}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Active
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded border border-yellow-300 text-center">
                          <div className="text-2xl font-bold text-yellow-700">
                            {content.pending}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Pending
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Share Stats */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase text-gray-600 border-b border-gray-200 pb-2">
                        🤝 Share Statistics
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 p-4 rounded border border-blue-300 text-center">
                          <div className="text-2xl font-bold text-blue-700">
                            {shares.given}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Given
                          </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded border border-purple-300 text-center">
                          <div className="text-2xl font-bold text-purple-700">
                            {shares.received}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Received
                          </div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded border border-orange-300 text-center">
                          <div className="text-2xl font-bold text-orange-700">
                            {shares.this_week}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            This Week
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-center text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                        Balance:{" "}
                        <strong>
                          {shares.balance > 0 ? "+" : ""}
                          {shares.balance}
                        </strong>
                        {shares.balance === 0 && " 🎯"}
                        {shares.balance > 0 && " 💰"}
                      </div>
                    </div>
                  </div>

                  {/* Daily Limit */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-gray-600 border-b border-gray-200 pb-2">
                      📅 Today's Share Limit
                    </h3>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {daily_limit.is_premium
                          ? "Premium: Unlimited Shares"
                          : "Free Tier"}
                      </span>
                      <span className="font-bold text-gray-900">
                        {daily_limit.is_premium
                          ? "∞"
                          : `${daily_limit.used} / ${daily_limit.limit}`}
                      </span>
                    </div>
                    <AnimatedProgressBar
                      progress={shareProgress}
                      color={
                        shareProgress > 80
                          ? "red"
                          : daily_limit.is_premium
                            ? "green"
                            : "blue"
                      }
                    />
                  </div>

                  {/* Milestones */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-gray-600 border-b border-gray-200 pb-2">
                      🏆 Milestones
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(milestones).map(([key, achieved]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded border ${
                            achieved
                              ? "bg-green-50 border-green-300"
                              : "bg-gray-50 border-gray-300"
                          }`}
                        >
                          <span
                            className={`text-xl ${achieved ? "text-green-600" : "text-gray-400"}`}
                          >
                            {achieved ? "✓" : "○"}
                          </span>
                          <span
                            className={`text-sm ${achieved ? "text-gray-900 font-medium" : "text-gray-500"}`}
                          >
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={fetchProgress}
                      className="px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition"
                    >
                      🔄 REFRESH DATA
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                    >
                      CLOSE
                    </button>
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

export default ProgressModal;
