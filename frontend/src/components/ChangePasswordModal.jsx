"use client";

import React, { Fragment, useState, useContext, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Lock, Info, Shield, CheckCircle, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import { AuthContext } from "../contexts/AuthContext";
import { BASE_URL } from "../lib/api";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { token } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.detail || "Failed to update password.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

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
                  <div className="relative flex items-center justify-between px-6 py-5 border-b-2 border-black bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                          Change Password
                        </Dialog.Title>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Update your account security
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

                    {/* Success Message */}
                    {message && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <div className="flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-green-900 uppercase tracking-wider mb-1">
                            Success
                          </h3>
                          <p className="text-sm text-green-800 leading-relaxed">
                            {message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Security Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-gray-600" />
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                          Security Information
                        </label>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          Updating your password will secure your account and
                          may require you to log in again on other devices.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-5">
                      {/* Current Password */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                          placeholder="Enter your current password"
                        />
                      </div>

                      {/* New Password Fields Grid */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Lock className="w-4 h-4 text-gray-600" />
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                            New Password
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium uppercase tracking-wider text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                              placeholder="Enter new password"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium uppercase tracking-wider text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password Requirements */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="w-4 h-4 text-gray-600" />
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                            Password Requirements
                          </label>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm text-blue-900">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                              <span>At least 8 characters long</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-blue-900">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                              <span>
                                Include uppercase and lowercase letters
                              </span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-blue-900">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                              <span>Include at least one number</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-blue-900">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                              <span>
                                Use a unique password you haven't used before
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full group relative px-4 py-3 text-sm font-bold uppercase tracking-wider text-white bg-red-600 border-2 border-red-600 rounded-xl hover:bg-red-700 hover:border-red-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" />
                            {loading
                              ? "Updating Password..."
                              : "Update Password"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Your password will be encrypted and secure
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Keep your account safe with a strong password
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
}

ChangePasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
