import React, { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { BASE_URL } from "../lib/api";
import Logo from "../components/Logo";
import { toast } from "react-hot-toast";
import {
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // ✅ Prevent duplicate requests
  const hasVerified = useRef(false);

  useEffect(() => {
    // ✅ Guard against multiple executions
    if (hasVerified.current) return;
    hasVerified.current = true;

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (email) {
      setUserEmail(email);
    }

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/auth/verify-email?token=${token}`,
          {
            method: "GET",
          },
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting...");

          login(data.access_token, data.user);

          setTimeout(() => {
            if (!data.user.has_profile_completed) {
              navigate("/app/profile-builder");
            } else {
              navigate("/app/home");
            }
          }, 2000);
        } else {
          setStatus("error");

          // ✅ Better error handling for already-verified users
          if (
            data.detail?.includes("already verified") ||
            data.detail?.includes("Invalid or expired")
          ) {
            setMessage(
              "This link has already been used or expired. If you already verified your email, please log in.",
            );
          } else {
            setMessage(data.detail || "Verification failed. Please try again.");
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred. Please try again later.");
      }
    };

    verifyEmail();
  }, []);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsResending(true);
      const response = await fetch(`${BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Check your inbox.");
      } else {
        toast.error(data.detail || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
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
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
          <div className="w-full max-w-md animate-fadeSlideUp">
            {/* Verifying State */}
            {status === "verifying" && (
              <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-8 sm:p-10 text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>Email Verification</span>
                </div>

                <div className="relative">
                  <div className="w-20 h-20 mx-auto">
                    <Loader2 className="w-full h-full text-black animate-spin" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                    Verifying Your Email
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Please wait while we confirm your email address...
                  </p>
                </div>

                <div className="flex justify-center gap-1">
                  <div
                    className="w-2 h-2 bg-black rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-black rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-black rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="bg-white border-2 border-green-600 rounded-2xl shadow-2xl p-8 sm:p-10 text-center space-y-6 animate-scaleIn">
                <div className="inline-flex items-center gap-2 bg-green-600 text-white rounded-full px-4 py-2 text-sm font-medium mb-4">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified</span>
                </div>

                <div className="relative">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center animate-ping">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-green-700 mb-2">
                    Email Verified!
                  </h2>
                  <p className="text-gray-600 text-sm">{message}</p>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting you now...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {status === "error" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white rounded-full px-4 py-2 mb-4 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    <span>Verification Failed</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                    Verification Failed
                  </h1>
                </div>

                {/* Error Card */}
                <div className="bg-white border-2 border-red-600 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-shake">
                  {/* Error Icon */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                  </div>

                  {/* Error Message */}
                  <div className="text-center">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {message}
                    </p>
                  </div>

                  {/* Resend Section */}
                  <div className="space-y-4 pt-2">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                        Request New Link
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="resend-email"
                        className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          id="resend-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="block w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pl-11 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all hover:border-gray-400"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <button
                      onClick={handleResendVerification}
                      disabled={isResending || !userEmail}
                      className="w-full rounded-xl border-2 border-black bg-white py-3 text-base font-bold text-black uppercase tracking-wider hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          Resend Verification Email
                        </>
                      )}
                    </button>
                  </div>

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

                  {/* Login Button */}
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full rounded-xl bg-black py-3 text-base font-bold text-white uppercase tracking-wider hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Go to Login
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Help Text */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                    <strong>Still having trouble?</strong> The verification link
                    expires after 24 hours. Request a new one above or{" "}
                    <button
                      onClick={() => navigate("/contact")}
                      className="text-black font-bold hover:underline"
                    >
                      contact support
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}
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
          @keyframes scaleIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fadeSlideUp {
            animation: fadeSlideUp 0.6s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-shake {
            animation: shake 0.4s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-scaleIn {
            animation: scaleIn 0.5s cubic-bezier(.4,0,.2,1) both;
          }
        `}</style>
      </div>
    </>
  );
};

export default VerifyEmail;
