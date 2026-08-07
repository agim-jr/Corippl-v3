// frontend/src/components/LogoutModal.jsx

"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { LogOut, AlertCircle, Info, X } from "lucide-react";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
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
                <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl border-2 border-black bg-white shadow-2xl transition-all">
                  {/* Header */}
                  <div className="relative flex items-center justify-between px-6 py-5 border-b-2 border-black bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <LogOut className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                          Confirm Logout
                        </Dialog.Title>
                        <p className="text-xs text-gray-600 mt-0.5">
                          End your current session
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
                    {/* Warning Message */}
                    <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-1">
                          Are you sure?
                        </h3>
                        <p className="text-sm text-red-800 leading-relaxed">
                          You're about to end your current session. You'll need
                          to log back in to access your account.
                        </p>
                      </div>
                    </div>

                    {/* Session Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-gray-600" />
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                          Session Information
                        </label>
                      </div>
                      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                        <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>
                              Your current session will be{" "}
                              <strong className="text-gray-900">
                                terminated immediately
                              </strong>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>
                              You'll be redirected to the{" "}
                              <strong className="text-gray-900">
                                login page
                              </strong>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>
                              All your data is{" "}
                              <strong className="text-gray-900">
                                saved automatically
                              </strong>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="group relative px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <X className="w-4 h-4" />
                          Cancel
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={onConfirm}
                        className="group relative px-4 py-3 text-sm font-bold uppercase tracking-wider text-white bg-red-600 border-2 border-red-600 rounded-xl hover:bg-red-700 hover:border-red-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <LogOut className="w-4 h-4" />
                          Logout
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        You can log back in anytime
                      </span>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
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
};

export default LogoutModal;
