import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  Zap,
  Users,
  Target,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import FeatureSection from "../components/FeatureSection";
import FaqSection from "../components/FaqSection";
import { useSEO } from "../lib/useSEO";
import { useApi } from "../lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

// Dashboard Preview with Route Selection Style
const DashboardPreview = () => {
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-black relative overflow-hidden">
      {/* Dotted Grid Background */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-30"
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}

        {/* Grid with 3 cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Audience Pool Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:scale-[1.03] border-2 border-black overflow-hidden">
            {/* Green accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

            {/* Icon Badge */}
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                  Audience Pool
                </h4>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Start Here
                </p>
              </div>
            </div>

            {/* Stage Badge */}
            <div className="bg-green-50 border-2 border-green-600 rounded-lg px-3 py-2 mb-4 inline-block">
              <p className="text-xs font-extrabold text-green-800 uppercase tracking-wider">
                🌱 STARTING (0-100 followers)
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">
              Get matched with creators building similar audiences. Find your
              first 100 true fans through authentic connections.
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Smart niche matching</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Free & authentic engagement</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Find collaboration partners</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <span className="text-sm font-bold text-green-700 uppercase tracking-wider group-hover:gap-2 flex items-center gap-1.5 transition-all">
                Start Discovering
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                <ArrowRight className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>

          {/* Creator Collectives Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:scale-[1.03] border-2 border-black overflow-hidden">
            {/* Orange accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>

            {/* Icon Badge */}
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                  Collectives
                </h4>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Level Up
                </p>
              </div>
            </div>

            {/* Stage Badge */}
            <div className="bg-orange-50 border-2 border-orange-600 rounded-lg px-3 py-2 mb-4 inline-block">
              <p className="text-xs font-extrabold text-orange-800 uppercase tracking-wider">
                🤝 GROWING (50+ followers)
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">
              Join small, matched groups for structured reciprocal support.
              Automated schedules keep everyone accountable.
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">
                  AI-matched groups (4-8 members)
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">
                  Rotating schedules & verification
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <span className="text-sm font-bold text-orange-700 uppercase tracking-wider group-hover:gap-2 flex items-center gap-1.5 transition-all">
                Join Groups
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <ArrowRight className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>

          {/* Quick Connects Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:scale-[1.03] border-2 border-black overflow-hidden">
            {/* Purple accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>

            {/* Icon Badge */}
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                  Quick Connects
                </h4>
                <p className="text-xs text-gray-600 uppercase tracking-wider">
                  Get Help
                </p>
              </div>
            </div>

            {/* Stage Badge */}
            <div className="bg-purple-50 border-2 border-purple-600 rounded-lg px-3 py-2 mb-4 inline-block">
              <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
                🚀 ALL LEVELS
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">
              Request help or offer expertise. Earn tokens by helping others,
              spend tokens to get community support.
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">
                  Request beta testers & advice
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">
                  Build reputation & earn tokens
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <span className="text-sm font-bold text-purple-700 uppercase tracking-wider group-hover:gap-2 flex items-center gap-1.5 transition-all">
                Start Connecting
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <ArrowRight className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-600 mb-5 leading-relaxed max-w-2xl mx-auto">
            <strong className="text-gray-900">
              Choose the path that fits your current stage
            </strong>{" "}
            — or use all three to maximize your growth!
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
            <span className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
              All Features Available Now
            </span>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_content_shares: 0,
    average_shares_per_user: 0,
    successful_cross_promotions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showScrollCTA, setShowScrollCTA] = useState(false);

  const { apiFetch, loginWithGoogle } = useApi();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // SEO Configuration
  useSEO({
    title:
      "Stop Wasting Money on Ads - Get Your Content Shared by 1,000+ Creators Free | Corippl",
    description:
      "Share someone else's content, get yours shared with their audience. No ad spend, no algorithms. Join 1,000+ creators using reciprocal sharing to grow authentically.",
    keywords:
      "content promotion, newsletter promotion, cross-promotion platform, free content marketing, reciprocal sharing, creator networking, audience growth",
    canonical: "https://www.corippl.com",
  });

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiFetch("/analytics/stats", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchStats();
  }, [apiFetch]);

  // Exit Intent Modal
  useEffect(() => {
    let exitIntentShown = false;

    const handleMouseLeave = (e) => {
      if (
        e.clientY <= 0 &&
        !exitIntentShown &&
        !sessionStorage.getItem("exitIntentSeen")
      ) {
        exitIntentShown = true;
        setShowExitModal(true);
        sessionStorage.setItem("exitIntentSeen", "true");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  // Scroll-Triggered CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
        100;

      if (scrollPercent > 40 && !sessionStorage.getItem("scrollCtaSeen")) {
        setShowScrollCTA(true);
        sessionStorage.setItem("scrollCtaSeen", "true");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Google Login Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);

      if (window.gtag) {
        window.gtag("event", "sign_up", {
          method: "Google",
          event_category: "Conversion",
          event_label: "Google Signup Success from Landing",
        });
      }

      login(data.access_token, data.user);

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

      toast.error(errorMessage);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google signup failed. Please try again.");
  };

  // Close modals
  const closeExitModal = () => setShowExitModal(false);
  const closeScrollCTA = () => setShowScrollCTA(false);

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        {/* Dotted background */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <Navbar />

          <main role="main">
            {/* HERO SECTION */}
            <section
              className="flex flex-col items-center justify-center flex-1 px-4 sm:px-6 pt-20 sm:pt-28 pb-12 sm:pb-20 max-w-6xl mx-auto w-full text-center"
              aria-label="Hero section"
            >
              {/* Pain Point Hook */}
              <div className="inline-flex items-center gap-2 bg-red-50 border-2 border-red-600 rounded-full px-4 py-2 mb-6 animate-fadeInHero">
                <span className="text-red-600 text-xl">⚠️</span>
                <span className="text-red-600 font-bold text-sm uppercase tracking-wide">
                  Stop Wasting Money on Ads That Don't Convert
                </span>
              </div>

              {/* Value Prop */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight animate-fadeInHero">
                Get Your Content Shared by{" "}
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text animate-gradientText">
                  Real Creators
                </span>
                <span className="block mt-2">Without Spending $1 on Ads</span>
              </h1>

              {/* Explainer */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto animate-fadeSlideUp leading-relaxed">
                Share someone else's content → Get yours shared with their
                audience.{" "}
                <span className="font-bold text-black">
                  Fair, reciprocal, and completely free to start.
                </span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto items-center justify-center animate-bounceIn">
                <Link
                  to="/signup"
                  onClick={() => {
                    if (window.gtag) {
                      window.gtag("event", "click", {
                        event_category: "CTA",
                        event_label: "Hero Primary CTA",
                        value: 1,
                      });
                    }
                  }}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-full text-base font-bold shadow-lg hover:shadow-xl hover:scale-105 focus:ring-2 focus:ring-gray-700 transition duration-150 whitespace-nowrap"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Start Sharing Free</span>
                </Link>

                <button
                  onClick={() => {
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black border-2 border-black rounded-full text-base font-bold hover:bg-gray-50 transition duration-150 whitespace-nowrap"
                >
                  <span>See How It Works</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Social Proof - Conditional */}
              {!loading && stats.total_users >= 50 && (
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-8 animate-fadeSlideUp">
                  {stats.total_content_shares > 0 && (
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        {stats.total_content_shares.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">
                        Content Shares This Week
                      </div>
                    </div>
                  )}
                  {stats.total_users > 0 && (
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        {stats.total_users.toLocaleString()}+
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">
                        Active Creators
                      </div>
                    </div>
                  )}
                  {stats.successful_cross_promotions > 0 && (
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        {stats.successful_cross_promotions.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">
                        Successful Collaborations
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-600 animate-fadeSlideUp mb-8">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-medium">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="font-medium">1 free share to test</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Cancel anytime</span>
                </div>
              </div>

              {/* BetaList Badge */}
              <div className="animate-fadeSlideUp">
                <a
                  target="_blank"
                  href="https://betalist.com/startups/corippl?utm_campaign=badge-corippl&utm_medium=badge&utm_source=badge-featured"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <img
                    alt="Corippl - Grow your audience with AI-powered content sharing | BetaList"
                    width="156"
                    height="54"
                    style={{ width: "156px", height: "54px" }}
                    src="https://betalist.com/badges/featured?id=148198&theme=color"
                  />
                </a>
              </div>
            </section>

            {/* DASHBOARD PREVIEW SECTION */}
            <section
              className="px-4 sm:px-6 py-16 sm:py-24 bg-white"
              id="how-it-works"
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 mb-6">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Three Ways to Grow
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Choose Your Growth Path
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                    Whether you're just starting or already growing, we have the
                    perfect tool for your stage
                  </p>
                </div>

                {/* Dashboard Preview */}
                <DashboardPreview />
              </div>
            </section>

            {/* Features */}
            <section
              className="px-4 sm:px-6 bg-white animate-fadeInSection"
              aria-label="Platform features"
            >
              <FeatureSection />
            </section>

            {/* FAQ */}
            <section
              className="animate-fadeInSection"
              aria-label="Frequently asked questions"
            >
              <FaqSection />
            </section>

            {/* Final CTA */}
            <section
              className="relative px-4 sm:px-6 py-16 sm:py-20 animate-fadeInSection delay-400"
              aria-label="Call to action"
            >
              <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                <div className="bg-black rounded-2xl shadow-2xl p-10 sm:p-12 lg:p-16 text-center">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                    Ready to Stop Wasting Money on Ads?
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Join thousands of creators using reciprocal sharing to grow
                    authentically. Start free today.
                  </p>
                  <Link
                    to="/signup"
                    onClick={() => {
                      if (window.gtag) {
                        window.gtag("event", "click", {
                          event_category: "CTA",
                          event_label: "Landing Bottom CTA",
                          value: 1,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full text-lg font-bold shadow-lg hover:scale-105 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span>Get Started Free</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>

            <Footer />
          </main>
        </div>

        {/* EXIT INTENT MODAL */}
        {showExitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scaleIn">
              <button
                onClick={closeExitModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="text-center">
                <div className="text-6xl mb-4">⏰</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Wait! Before You Go...
                </h3>
                <p className="text-gray-600 mb-6">
                  Get your{" "}
                  <span className="font-bold text-black">
                    first content share completely free
                  </span>
                  . No credit card, no commitment. See how Corippl works in 2
                  minutes.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">2 min</div>
                      <div className="text-gray-600 text-xs">Setup time</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">$0</div>
                      <div className="text-gray-600 text-xs">To start</div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/signup"
                  onClick={() => {
                    closeExitModal();
                    if (window.gtag) {
                      window.gtag("event", "click", {
                        event_category: "Exit Intent",
                        event_label: "Exit Modal CTA",
                      });
                    }
                  }}
                  className="inline-flex items-center justify-center w-full bg-black text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-800 transition mb-4"
                >
                  Claim My Free Share →
                </Link>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={closeExitModal}
                    className="text-gray-500 text-sm hover:text-gray-700 transition"
                  >
                    I'll look around first
                  </button>

                  <Link
                    to="/promote"
                    onClick={() => {
                      closeExitModal();
                      if (window.gtag) {
                        window.gtag("event", "click", {
                          event_category: "Exit Intent",
                          event_label: "Exit Modal - Promote Link",
                        });
                      }
                    }}
                    className="text-blue-600 text-sm hover:text-blue-800 underline"
                  >
                    Show me how it works instead
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCROLL-TRIGGERED CTA */}
        {showScrollCTA && (
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slideUp px-4 sm:px-0">
            <div className="bg-black text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 max-w-full">
              <span className="font-bold text-sm">
                🚀 Ready to start? Get your first share free
              </span>

              <div className="flex items-center gap-3">
                <Link
                  to="/signup"
                  className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition whitespace-nowrap"
                  onClick={() => {
                    if (window.gtag) {
                      window.gtag("event", "click", {
                        event_category: "Scroll CTA",
                        event_label: "Floating Bottom CTA",
                      });
                    }
                  }}
                >
                  Sign Up
                </Link>

                <button
                  onClick={closeScrollCTA}
                  className="text-gray-400 hover:text-white transition"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animations */}
        <style>{`
          @keyframes fadeInHero {
            0% { opacity: 0; transform: translateY(30px);}
            100% { opacity: 1; transform: none;}
          }
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(16px);}
            100% { opacity: 1; transform: none;}
          }
          @keyframes fadeInSection {
            0% { opacity: 0; transform: translateY(32px);}
            100% { opacity: 1; transform: none;}
          }
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.8);}
            60% { opacity: 1; transform: scale(1.08);}
            100% { opacity: 1; transform: scale(1);}
          }
          @keyframes gradientText {
            to {
              background-position: 200% center;
            }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes scaleIn {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes slideUp {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
          }
          .animate-fadeInHero {
            animation: fadeInHero 0.85s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-fadeSlideUp {
            animation: fadeSlideUp 1s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-fadeInSection {
            animation: fadeInSection 0.9s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-bounceIn {
            animation: bounceIn 0.7s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-gradientText {
            background-size: 200% auto;
            animation: gradientText 3s linear infinite alternate;
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out both;
          }
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out both;
          }
          .animate-slideUp {
            animation: slideUp 0.5s ease-out both;
          }
          .delay-400 {
            animation-delay: 0.4s;
          }
        `}</style>
      </div>
    </>
  );
};

export default Landing;
