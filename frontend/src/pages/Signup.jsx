import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Logo from "../components/Logo";
import { GoogleLogin } from "@react-oauth/google";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import { BASE_URL } from "../lib/api";
import { UserPlus, Sparkles, Eye, EyeOff, Shield } from "lucide-react";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const passwordStrength = (password) => {
  if (!password) return "";
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return "Weak";
  if (strength === 3) return "Medium";
  if (strength >= 4) return "Strong";
};

const strengthColor = (strength) => {
  if (strength === "Weak") return "bg-red-500";
  if (strength === "Medium") return "bg-yellow-500";
  if (strength === "Strong") return "bg-green-500";
  return "bg-gray-200";
};

const strengthWidth = (strength) => {
  if (strength === "Weak") return "w-1/3";
  if (strength === "Medium") return "w-2/3";
  if (strength === "Strong") return "w-full";
  return "w-0";
};

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { loginWithGoogle } = useApi();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (!username || !email || !password || !agreeTerms) {
      setError("Please fill in all required fields and agree to the terms.");
      setLoading(false);
      return;
    }
    const emailRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRgx.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (passwordStrength(password) === "Weak") {
      setError("Password is too weak. Please use a stronger password.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // Track signup conversion
        if (window.gtag) {
          window.gtag("event", "sign_up", {
            method: "Email",
            event_category: "Conversion",
            event_label: "Email Signup Success",
          });
        }

        // Redirect to email verification page
        setSuccessMsg("Account created! Check your email to verify.");
        setTimeout(() => {
          navigate("/email-verification", {
            state: { email: data.email },
            replace: true,
          });
        }, 1500);
      } else {
        // Handle rate limiting
        if (response.status === 429) {
          setError(
            "Too many signup attempts. Please try again in a few hours.",
          );
          setLoading(false);
          return;
        }

        const errorData = await response.json();
        setError(errorData.detail || "Signup failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);

      // Track Google signup
      if (window.gtag) {
        window.gtag("event", "sign_up", {
          method: "Google",
          event_category: "Conversion",
          event_label: "Google Signup Success",
        });
      }

      login(data.access_token, data.user);

      // Check if profile is completed
      if (!data.user.has_profile_completed) {
        localStorage.setItem(`hasCompletedTour-${data.user.id}`, "false");
        toast.success(
          "Successfully signed up with Google! Please complete your profile.",
        );
        setTimeout(() => navigate("/app/profile-builder"), 1200);
      } else {
        toast.success("Successfully logged in with Google!");
        setTimeout(() => navigate("/app/home"), 1200);
      }
    } catch (error) {
      console.error("Google signup error:", error);

      // Provide more specific error messages
      let errorMessage = "Google signup failed. Please try again.";

      if (error.message?.includes("already linked")) {
        errorMessage =
          "This email is already linked to another Google account. Please use a different email or log in.";
      } else if (error.message?.includes("Invalid token")) {
        errorMessage = "Google authentication expired. Please try again.";
      } else if (error.message?.includes("Network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError("Google signup failed. Please try again.");
    toast.error("Google signup failed. Please try again.");
  };

  const pwdStrength = passwordStrength(password);

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
                <span>Join the Community</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                Create Account
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Start your creator growth journey today
              </p>
            </div>

            {/* Signup Card */}
            <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-xl border-2 border-red-600 bg-red-50 p-4 text-center animate-shake">
                  <p className="text-red-700 font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="rounded-xl border-2 border-green-600 bg-green-50 p-4 text-center animate-pulse">
                  <p className="text-green-700 font-bold text-sm">
                    {successMsg}
                  </p>
                </div>
              )}

              {/* Signup Form */}
              <form onSubmit={handleSignup} className="space-y-5">
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
                      placeholder="Choose a unique username"
                      autoComplete="username"
                      aria-label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email-address"
                      className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider"
                    >
                      Email
                    </label>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      aria-label="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        aria-label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all hover:border-gray-400"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition-colors"
                        tabIndex={-1}
                        onClick={() => setShowPassword((show) => !show)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-gray-600" />
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Password Strength
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strengthColor(pwdStrength)} ${strengthWidth(pwdStrength)} transition-all duration-300`}
                          ></div>
                        </div>
                        <p
                          className={`text-xs font-bold mt-2 ${
                            pwdStrength === "Weak"
                              ? "text-red-600"
                              : pwdStrength === "Medium"
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {pwdStrength} password
                          {pwdStrength === "Weak" &&
                            " - Add uppercase, numbers, or symbols"}
                          {pwdStrength === "Medium" && " - Almost there!"}
                          {pwdStrength === "Strong" && " - Great choice!"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start">
                  <label className="flex items-start gap-3 cursor-pointer text-sm leading-relaxed">
                    <input
                      id="agree-terms"
                      name="agree-terms"
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={() => setAgreeTerms((v) => !v)}
                      className="rounded border-2 border-gray-300 bg-white checked:bg-black checked:border-black focus:ring-2 focus:ring-black transition w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-gray-700">
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        className="font-bold text-black hover:underline"
                      >
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        className="font-bold text-black hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {/* Sign Up Button */}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
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

              {/* Google Login */}
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  logo_alignment="left"
                  width="100%"
                />
              </div>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-black hover:underline hover:scale-105 inline-block transition-transform"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Terms & Privacy */}
            <p className="text-xs text-center text-gray-500 px-4 pt-6 max-w-md mx-auto leading-relaxed">
              By signing up, you agree to our{" "}
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

export default Signup;
