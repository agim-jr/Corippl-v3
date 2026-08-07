import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Sparkles, Zap } from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import FaqPrice from "../components/FaqPrice";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import stripePromise from "../lib/stripe";
import { useApi } from "../lib/api";
import { useSEO } from "../lib/useSEO";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const Pricing = () => {
  const { isPremium, user } = useContext(AuthContext);
  const { createCheckoutSession } = useApi();
  const navigate = useNavigate();

  useSEO({
    title: "Pricing Plans - AI-Powered Creator Growth | Corippl",
    description:
      "Simple pricing for creator collaboration. Start free with AI-matched growth strategy, or unlock all routes with Pro for unlimited AI features.",
    keywords:
      "creator pricing, AI growth tools, content collaboration, creator network pricing, audience building plans",
    canonical: "https://www.corippl.com/pricing",
  });

  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_title: "Pricing",
        page_location: window.location.href,
        page_path: "/pricing",
      });
    }
  }, []);

  const TIERS = [
    {
      id: "free",
      name: "Explorer",
      tagline: "Start for free",
      description: "Experience one AI-matched growth path with basic features.",
      price: "Free",
      pricePeriod: "Forever",
      cta: "Start Free",
      href: "/signup",
      icon: Sparkles,
      features: [
        "1 AI-matched growth route",
        "20 creators/day in queue",
        "3 active submissions",
        "Basic AI profile analysis",
        "100 starting tokens",
      ],
      highlight: false,
    },
    {
      id: "premium",
      name: "Pro",
      tagline: "Most popular",
      description: "Unlock all routes with unlimited AI-powered collaboration.",
      price: billingCycle === "monthly" ? "$29" : "$276",
      pricePeriod: billingCycle === "monthly" ? "per month" : "per year",
      cta: "Upgrade to Pro",
      href: "/signup",
      icon: Zap,
      features: [
        "All 3 growth routes unlocked",
        "Unlimited AI matching & predictions",
        "Unlimited queue browsing",
        "Unlimited submissions & messages",
        "200 bonus tokens every month",
      ],
      highlight: true,
      tag: "Most Popular",
      savings: billingCycle === "annual" ? "Save $72/year" : null,
    },
  ];

  const handleUpgrade = async (tierId) => {
    if (!user) {
      toast.info("Please log in to upgrade your plan.");
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    if (tierId === "premium") {
      if (isPremium) {
        toast.info("You are already a Pro user.");
        return;
      }

      try {
        const data = await createCheckoutSession("premium", billingCycle);
        if (data.checkout_session_id) {
          const stripe = await stripePromise;

          if (window.gtag) {
            window.gtag("event", "begin_checkout", {
              event_category: "Conversion",
              event_label: `Pro ${billingCycle}`,
              value: billingCycle === "monthly" ? 29 : 276,
            });
          }
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.checkout_session_id,
          });
          if (error) {
            console.error("Stripe redirect error:", error);
            toast.error("Failed to initiate payment.");
          }
        } else {
          toast.error("Failed to initiate payment.");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred while processing your request.");
      }
    }
  };

  const renderActionButton = (tier) => {
    const isCurrentPlan = tier.id === "premium" && isPremium;

    if (tier.id === "premium") {
      return (
        <button
          onClick={() => handleUpgrade("premium")}
          disabled={isCurrentPlan}
          aria-describedby={tier.id}
          className={`mt-6 sm:mt-8 w-full rounded-xl px-6 py-4 text-center text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            isCurrentPlan
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
              : tier.highlight
                ? "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow hover:shadow-lg hover:scale-105"
          }`}
        >
          {isCurrentPlan ? "Current Plan" : tier.cta}
        </button>
      );
    } else {
      return (
        <Link
          to={tier.href}
          aria-describedby={tier.id}
          className="mt-6 sm:mt-8 w-full block rounded-xl px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          {tier.cta}
        </Link>
      );
    }
  };

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <Navbar />

          <div className="mx-auto max-w-7xl px-6 lg:px-8 flex-grow py-12 sm:py-20">
            {/* Hero Section */}
            <div className="mx-auto max-w-4xl text-center mb-12 sm:mb-16 animate-fadeInHero">
              <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 mb-6 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Simple, Transparent Pricing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                Simple Pricing.
                <br />
                Unlimited Growth.
              </h1>
              <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
                Start free with one AI-matched growth strategy. Upgrade to Pro
                for unlimited access to all collaboration tools.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-12 animate-fadeSlideUp">
              <div className="inline-flex items-center bg-gray-100 rounded-xl p-1.5 border-2 border-gray-200 shadow-sm">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 sm:px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                    billingCycle === "monthly"
                      ? "bg-black text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-6 sm:px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 relative ${
                    billingCycle === "annual"
                      ? "bg-black text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Annual
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2 animate-fadeSlideUp delay-200">
              {TIERS.map((tier) => {
                const IconComponent = tier.icon;
                return (
                  <div
                    key={tier.id}
                    className={`flex flex-col justify-between rounded-2xl bg-white p-8 transition-all duration-200 hover:scale-[1.02] ${
                      tier.highlight
                        ? "border-4 border-black shadow-2xl relative z-10 lg:scale-105"
                        : "border-2 border-gray-200 shadow-lg hover:border-black"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-x-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${tier.highlight ? "bg-black" : "bg-gray-100"}`}
                          >
                            <IconComponent
                              className={`w-5 h-5 ${tier.highlight ? "text-white" : "text-black"}`}
                            />
                          </div>
                          <h3
                            id={tier.id}
                            className="text-2xl font-black uppercase tracking-tight text-gray-900"
                          >
                            {tier.name}
                          </h3>
                        </div>
                        {tier.tag && (
                          <span className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase rounded-full tracking-wider whitespace-nowrap">
                            {tier.tag}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        {tier.description}
                      </p>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-x-2">
                          <span className="text-5xl font-black tracking-tight text-gray-900">
                            {tier.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 font-medium">
                          {tier.pricePeriod}
                        </p>
                        {tier.savings && (
                          <div className="text-sm text-white font-bold mt-2 bg-green-600 inline-block px-3 py-1 rounded-full">
                            {tier.savings}
                          </div>
                        )}
                      </div>

                      <div className="border-t-2 border-gray-100 mb-6"></div>

                      <ul role="list" className="space-y-3 text-gray-700">
                        {tier.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex gap-x-3 items-start"
                          >
                            <CheckIcon className="h-5 w-5 flex-none text-black mt-0.5" />
                            <span className="text-sm font-medium">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {renderActionButton(tier)}
                  </div>
                );
              })}
            </div>

            {/* Value Proposition */}
            <div className="text-center py-12 px-6 animate-fadeSlideUp delay-300">
              <h3 className="text-2xl font-bold mb-4">
                No hidden fees. No AI credit limits.
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Unlike other platforms, we don't charge per AI query or limit
                your matches. Pro tier gives you{" "}
                <strong>truly unlimited</strong> access to all AI features.
              </p>
            </div>

            {/* Feature Comparison Table */}
            <div className="mx-auto max-w-5xl px-6 py-16 animate-fadeSlideUp delay-400">
              <h2 className="text-3xl font-bold text-center mb-8">
                Feature Comparison
              </h2>
              <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-black bg-gray-50">
                        <th className="px-6 py-4 text-left font-bold uppercase text-sm">
                          Feature
                        </th>
                        <th className="px-6 py-4 text-center font-bold uppercase text-sm">
                          Explorer
                        </th>
                        <th className="px-6 py-4 text-center font-bold uppercase text-sm bg-black text-white">
                          Pro
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">Growth Routes</td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          1 route (AI-matched)
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          All 3 routes
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">
                          AI Matching & Predictions
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          Basic compatibility
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Unlimited + success scores
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">Queue Access</td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          20 creators/day
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Unlimited
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">
                          Active Submissions
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          3 at once
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Unlimited
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">Icebreakers</td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          Generic templates
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Unlimited AI-personalized
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">
                          Profile Analysis
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          Basic (1x/month)
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Deep AI analysis anytime
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">Analytics</td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          Basic stats
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Advanced dashboard + trends
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">Tokens</td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          100 starting
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          100 starting + 200/month
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">Messages</td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          5 new chats/day
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Unlimited
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-6 py-4 font-medium">
                          Group Features
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          Join 2 groups (manual scheduling)
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          Create & join unlimited (AI scheduling)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium">
                          Priority Boost
                        </td>
                        <td className="px-6 py-4 text-center">
                          <XMarkIcon className="h-5 w-5 text-gray-400 mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-center font-semibold bg-gray-50">
                          25% boost in queues
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="animate-fadeInSection delay-600">
            <FaqPrice />
          </div>

          {/* CTA Section */}
          <section className="relative px-4 py-16 sm:py-20 animate-fadeInSection delay-800">
            <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
              <div className="bg-black rounded-2xl shadow-2xl p-10 sm:p-12 lg:p-16 text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                  Ready to Accelerate Your Growth?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join creators using AI-powered tools to build authentic
                  partnerships and grow faster together.
                </p>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-8 py-4 bg-white text-black rounded-full text-lg font-bold shadow-lg hover:scale-105 hover:bg-gray-100 transition-all duration-200"
                >
                  Start Free
                  <svg
                    className="w-5 h-5 ml-2"
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
        </div>

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
          .animate-fadeInHero {
            animation: fadeInHero 0.9s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-fadeSlideUp {
            animation: fadeSlideUp 1s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-fadeInSection {
            animation: fadeInSection 0.9s cubic-bezier(.4,0,.2,1) both;
          }
          .delay-200 {
            animation-delay: 0.2s;
          }
          .delay-300 {
            animation-delay: 0.3s;
          }
          .delay-400 {
            animation-delay: 0.4s;
          }
          .delay-600 {
            animation-delay: 0.6s;
          }
          .delay-800 {
            animation-delay: 0.8s;
          }
        `}</style>
      </div>
    </>
  );
};

export default Pricing;
