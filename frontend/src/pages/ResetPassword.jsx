// frontend/src/pages/ResetPassword.jsx

import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useApi } from "../lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const api = useApi(); // Initialize the API hook

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' | 'error'
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 py-10 font-mono">
        <div className="w-full max-w-sm bg-white border border-black rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-black mb-4 font-mono">
              Invalid Reset Link
            </h2>
            <p className="text-red-600 mb-4 font-mono">
              Invalid or missing password reset token.
            </p>
            <Link
              to="/forgot-password"
              className="font-bold underline text-black hover:text-white hover:bg-black px-2 py-1 rounded transition font-mono"
            >
              Request a new password reset
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Basic password validation
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const response = await api.resetPassword(token, newPassword);
      setMessage(
        "Your password has been reset successfully! Redirecting to login..."
      );
      setMessageType("success");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage(error.detail || "Failed to reset password. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 py-10 font-mono">
      <div className="w-full max-w-sm bg-white border border-black rounded-2xl shadow-2xl p-8 space-y-8">
        <div>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-black mb-2 font-mono">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        {message && (
          <div
            className={`mb-2 rounded border ${
              messageType === "success"
                ? "border-green-600 bg-green-50"
                : "border-red-600 bg-red-50"
            } p-2 text-center flex items-center justify-center gap-2`}
          >
            {messageType === "success" ? (
              // Success icon
              <svg
                className="h-5 w-5 text-green-600 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              // Error icon
              <svg
                className="h-5 w-5 text-red-600 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-5a1 1 0 11-2 0v-2a1 1 0 112 0v2zm-1-8a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span
              className={`font-bold text-sm ${
                messageType === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {message}
            </span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                placeholder="New Password"
                autoComplete="new-password"
                aria-label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-xl border border-black bg-white px-4 py-3 text-base text-black font-mono placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition"
              />
            </div>
            <div>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                placeholder="Confirm New Password"
                autoComplete="new-password"
                aria-label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-black bg-white px-4 py-3 text-base text-black font-mono placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl border border-black bg-black py-3 text-base font-bold text-white font-mono shadow-sm hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-black transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="text-sm text-center mt-2">
          <Link
            to="/login"
            className="font-bold underline text-black hover:text-white hover:bg-black px-2 py-1 rounded transition font-mono"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
