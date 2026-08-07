import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { BASE_URL } from "../lib/api";
import { toast } from "react-toastify";

const EmailVerification = () => {
  const location = useLocation();
  const email = location.state?.email || "";
  const [resending, setResending] = useState(false);
  const [resentCount, setResentCount] = useState(0);

  const handleResendEmail = async () => {
    if (resentCount >= 3) {
      toast.error("Maximum resend attempts reached. Please contact support.");
      return;
    }

    setResending(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResentCount(resentCount + 1);
        toast.success("Verification email sent! Check your inbox.");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to resend email.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-mono">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-md bg-white border-2 border-black rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-4xl">
              📧
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              Check Your Email!
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              We've sent a verification link to:
            </p>
            <p className="text-black font-bold mt-2 break-all">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-black text-sm">Next Steps:</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Complete your profile and start sharing!</li>
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-yellow-900 text-sm font-bold">
                  Link expires in 24 hours
                </p>
                <p className="text-yellow-800 text-xs mt-1">
                  For security reasons, verification links are only valid for 24
                  hours.
                </p>
              </div>
            </div>
          </div>

          {/* Resend Button */}
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={resending || resentCount >= 3}
              className={`w-full rounded-xl border-2 border-black py-3 text-sm font-bold font-mono transition ${
                resending || resentCount >= 3
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {resending
                ? "Sending..."
                : resentCount >= 3
                  ? "Maximum Resends Reached"
                  : "Resend Verification Email"}
            </button>

            {resentCount > 0 && resentCount < 3 && (
              <p className="text-xs text-gray-500 text-center">
                Resent {resentCount} time{resentCount > 1 ? "s" : ""}.{" "}
                {3 - resentCount} remaining.
              </p>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>
              Didn't receive the email?
              <br />
              Check your spam folder or{" "}
              <button
                onClick={handleResendEmail}
                className="text-black font-bold underline hover:no-underline"
                disabled={resending || resentCount >= 3}
              >
                resend it
              </button>
              .
            </p>
            <p className="mt-4">
              Wrong email?{" "}
              <Link
                to="/signup"
                className="text-black font-bold underline hover:no-underline"
              >
                Sign up again
              </Link>
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center font-mono text-gray-400 px-4 sm:px-6 pb-4 sm:pb-6">
        Need help? Contact{" "}
        <a
          href="mailto:support@corippl.com"
          className="text-black underline hover:no-underline"
        >
          support@corippl.com
        </a>
      </p>
    </div>
  );
};

export default EmailVerification;
