"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  X,
  Mail,
  Bell,
  TrendingUp,
  Calendar,
  Megaphone,
  Award,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

export default function EmailPreferencesModal({ isOpen, onClose }) {
  const { apiFetch } = useApi();

  const [preferences, setPreferences] = useState({
    email_content_shared: true,
    email_content_shared_milestone: true,
    email_daily_digest: false,
    email_weekly_stats: true,
    email_marketing: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/preferences/", { method: "GET" });
      const data = await response.json();
      setPreferences(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load preferences:", err);
      setError("Failed to load your email preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await apiFetch("/preferences/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const updatedPreferences = await response.json();
        setPreferences(updatedPreferences);
        toast.success("Email preferences updated successfully!");
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update preferences");
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
      toast.error("Failed to update email preferences. Please try again.");
      setError("Failed to save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const preferenceItems = [
    {
      key: "email_content_shared",
      label: "Content Shared",
      description: "When someone shares your content",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      key: "email_content_shared_milestone",
      label: "Milestones",
      description: "Content reaches share milestones",
      icon: <Award className="w-4 h-4" />,
    },
    {
      key: "email_daily_digest",
      label: "Daily Digest",
      description: "Daily performance summary",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      key: "email_weekly_stats",
      label: "Weekly Stats",
      description: "Weekly performance insights",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      key: "email_marketing",
      label: "Updates & News",
      description: "Platform updates and features",
      icon: <Megaphone className="w-4 h-4" />,
    },
  ];

  const activeCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = preferenceItems.length;

  return (
    <>
      <style>{fontStyles}</style>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Backdrop with Dotted Pattern */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm">
              <div
                className="fixed inset-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
                aria-hidden="true"
              />
            </div>
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
                <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border-2 border-black bg-white shadow-2xl transition-all">
                  {/* Header */}
                  <div className="relative flex items-center justify-between px-6 py-5 border-b-2 border-black bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                          Email Preferences
                        </Dialog.Title>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Manage your notification settings
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-all"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-6 space-y-5">
                    {/* Error Message */}
                    {error && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-1">
                            Error
                          </h3>
                          <p className="text-sm text-red-800 leading-relaxed">
                            {error}
                          </p>
                        </div>
                      </div>
                    )}

                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <>
                        {/* Notification Preferences */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Bell className="w-4 h-4 text-gray-600" />
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                              Email Notifications
                            </label>
                          </div>
                          <div className="space-y-3">
                            {preferenceItems.map((item) => (
                              <div
                                key={item.key}
                                className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0 mt-1 text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                      {item.label}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-0.5">
                                      {item.description}
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={preferences[item.key]}
                                      onChange={() => handleToggle(item.key)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`relative w-12 h-6 rounded-full border-2 transition-all ${
                                        preferences[item.key]
                                          ? "bg-blue-600 border-blue-600"
                                          : "bg-gray-300 border-gray-300"
                                      }`}
                                    >
                                      <div
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                                          preferences[item.key]
                                            ? "translate-x-6"
                                            : "translate-x-0"
                                        }`}
                                      />
                                    </div>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary Statistics */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-gray-600" />
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                              Summary
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Active
                              </label>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-900">
                                  {activeCount}
                                </span>
                                <span className="text-sm text-gray-600">
                                  of {totalCount}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Level
                              </label>
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg ${
                                  activeCount >= 4
                                    ? "bg-green-100 text-green-800 border-2 border-green-300"
                                    : activeCount >= 2
                                      ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                                      : "bg-red-100 text-red-800 border-2 border-red-300"
                                }`}
                              >
                                {activeCount >= 4 ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    High
                                  </>
                                ) : activeCount >= 2 ? (
                                  <>
                                    <Info className="w-3 h-3" />
                                    Medium
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3" />
                                    Low
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-2">
                          <button
                            onClick={savePreferences}
                            disabled={saving}
                            className="w-full group relative px-4 py-3 text-sm font-bold uppercase tracking-wider text-white bg-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-700 hover:border-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {saving ? "Saving..." : "Save Preferences"}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Changes take effect immediately
                      </span>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex justify-center items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Stay informed with personalized notifications
                      </span>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
