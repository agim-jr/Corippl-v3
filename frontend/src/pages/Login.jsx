// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Logo from "../components/Logo";
import { GoogleLogin } from "@react-oauth/google";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import { BASE_URL } from "../lib/api";
import { LogIn, Sparkles } from "lucide-react";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { loginWithGoogle } = useApi();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setShowResendVerification(false);

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.access_token, data.user);

        // Check if user needs to complete profile
        const user = data.user;
        if (!user.has_profile_completed) {
          navigate("/app/profile-builder");
        } else {
          navigate("/app/home");
        }
      } else {
        // Handle rate limiting
        if (response.status === 429) {
          setErrorMsg(
            "Too many login attempts. Please try again in a few minutes.",
          );
          return;
        }

        const errorData = await response.json();

        // Handle email not verified error
        if (response.status === 403) {
          setErrorMsg(
            "Please verify your email before logging in. Check your inbox for the verification link.",
          );
          setShowResendVerification(true);
          setUnverifiedEmail(username);
        } else {
          setErrorMsg(errorData.detail || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred. Please try again later.");
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      if (response.ok) {
        toast.success("Verification email sent! Check your inbox.");
        navigate("/email-verification", {
          state: { email: unverifiedEmail },
        });
      } else {
        toast.error("Failed to resend verification email.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      login(data.access_token, data.user);
      toast.success("Successfully logged in with Google!");

      // Check if user needs to complete profile
      const user = data.user;
      if (!user.has_profile_completed) {
        navigate("/app/profile-builder");
      } else {
        navigate("/app/home");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMsg(error.message || "Google login failed. Please try again.");
      toast.error("Google login failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setErrorMsg("Google login failed. Please try again.");
    toast.error("Google login failed. Please try again.");
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
                <span>Welcome Back</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                Sign In
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Continue your creator growth journey
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Error Message */}
              {errorMsg && (
                <div className="rounded-xl border-2 border-red-600 bg-red-50 p-4 text-center animate-shake">
                  <p className="text-red-700 font-bold text-sm">{errorMsg}</p>
                  {showResendVerification && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="mt-3 text-sm text-black underline hover:no-underline font-bold hover:bg-black hover:text-white px-3 py-1 rounded transition-all"
                    >
                      Resend Verification Email
                    </button>
                  )}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider"
                    >
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder="Enter your username"
                      autoComplete="username"
                      aria-label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <label className="flex items-center gap-2 cursor-pointer text-black text-sm">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="rounded border-2 border-gray-300 bg-white checked:bg-black checked:border-black focus:ring-2 focus:ring-black transition w-4 h-4 cursor-pointer"
                    />
                    <span className="font-medium">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-black font-bold hover:underline hover:scale-105 transition-transform"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-black py-3.5 text-base font-bold text-white uppercase tracking-wider shadow-lg hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
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

              {/* Google Login */}
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                  width="100%"
                />
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-bold text-black hover:underline hover:scale-105 inline-block transition-transform"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>

            {/* Terms & Privacy */}
            <p className="text-xs text-center text-gray-500 px-4 pt-6 max-w-md mx-auto leading-relaxed">
              By continuing, you agree to our{" "}
              <Link
                to="/terms"
                className="text-black underline hover:no-underline font-bold"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-black underline hover:no-underline font-bold"
              >
                Privacy Policy
              </Link>
              .
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
          .animate-fadeSlideUp {
            animation: fadeSlideUp 0.6s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-shake {
            animation: shake 0.4s cubic-bezier(.4,0,.2,1) both;
          }
        `}</style>
      </div>
    </>
  );
};

export default Login;
