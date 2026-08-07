// frontend/src/pages/ForgotPassword.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../lib/api";
import Logo from "../components/Logo";
import {
  Mail,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setLoading(true);

    // Basic email validation
    const emailRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRgx.test(email)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const response = await api.requestPasswordReset(email);
      setMessage(
        response.message || "Check your inbox for a password reset link.",
      );
      setMessageType("success");
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setMessage(
        error.detail || "Unable to send reset link. Please try again.",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        {/* Dotted Grid Background */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <Logo />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
          <div className="w-full max-w-md animate-fadeSlideUp">
            {/* Header Card */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 mb-4 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Password Recovery</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                Reset Password
              </h1>
              <p className="text-gray-600 text-sm sm:text-base max-w-sm mx-auto">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Success/Error Message */}
              {message && (
                <div
                  className={`rounded-xl border-2 p-4 flex items-start gap-3 ${
                    messageType === "success"
                      ? "border-green-600 bg-green-50 animate-slideDown"
                      : "border-red-600 bg-red-50 animate-shake"
                  }`}
                >
                  {messageType === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`font-bold text-sm ${
                      messageType === "success"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {message}
                  </p>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      aria-label="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pl-11 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all hover:border-gray-400"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    We'll send a password reset link to this email if it exists
                    in our system.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-xl bg-black py-3.5 text-base font-bold text-white uppercase tracking-wider shadow-lg hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500 font-bold uppercase tracking-wider">
                    Or
                  </span>
                </div>
              </div>

              {/* Back to Login */}
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white py-3 text-base font-bold text-black uppercase tracking-wider hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Link>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                <strong>Didn't receive the email?</strong> Check your spam
                folder or{" "}
                <button
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  className="text-black font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  request another link
                </button>
                .
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                    Security Notice
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    For your security, password reset links expire after 1 hour
                    and can only be used once.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Link */}
            <p className="text-xs text-center text-gray-500 px-4 pt-6 max-w-md mx-auto">
              Having trouble?{" "}
              <Link
                to="/contact"
                className="text-black underline hover:no-underline font-bold"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        <style>{`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes slideDown {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeSlideUp {
            animation: fadeSlideUp 0.6s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-shake {
            animation: shake 0.4s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-slideDown {
            animation: slideDown 0.4s cubic-bezier(.4,0,.2,1) both;
          }
        `}</style>
      </div>
    </>
  );
};

export default ForgotPassword;
