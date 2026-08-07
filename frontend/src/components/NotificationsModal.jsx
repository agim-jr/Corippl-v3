// frontend/src/components/NotificationsModal.jsx
"use client";

import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useApi } from "../lib/api";

// Custom Scrollbar
const scrollbarStyles = `
  .notifications-modal-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .notifications-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .notifications-modal-scroll::-webkit-scrollbar-track {
    background: #fff;
  }
  .notifications-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #fff;
  }
`;

const NotificationsModal = ({ isOpen, onClose }) => {
  const { getNotifications, markAsRead } = useApi();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getNotifications()
        .then((data) => {
          setNotifications(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [isOpen, getNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif,
        ),
      );
    } catch {
      // optional error handling
    }
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((notif) => {
      if (!notif.is_read) {
        handleMarkAsRead(notif.id);
      }
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
                    Notifications
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
                  {error && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Error
                      </label>
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm leading-relaxed text-red-600">
                        {error}
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Status
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed">
                        Loading notifications...
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Status
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm leading-relaxed text-gray-500">
                        No notifications available
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Recent Activity
                      </label>
                      <div className="max-h-96 overflow-y-auto notifications-modal-scroll space-y-3">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border rounded transition-all ${
                              notif.is_read
                                ? "bg-white border-gray-200"
                                : "bg-gray-50 border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm leading-relaxed ${
                                    notif.is_read
                                      ? "text-gray-700"
                                      : "text-gray-900 font-medium"
                                  }`}
                                >
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {notif.created_at
                                      ? new Date(
                                          notif.created_at,
                                        ).toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </span>
                                  {notif.is_read && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                      <CheckIcon className="h-3 w-3" />
                                      Read
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!notif.is_read && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="ml-3 flex-shrink-0 px-3 py-1 text-xs font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition"
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  {notifications.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                          Total Notifications
                        </label>
                        <span className="text-sm font-bold">
                          {notifications.length}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                          Unread
                        </label>
                        <span className="text-sm font-bold">{unreadCount}</span>
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
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      >
                        Mark All Read
                      </button>
                    )}
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

export default NotificationsModal;
