import React, { Fragment, useContext, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Sparkles, Zap, X, Check, Info } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import stripePromise from "../lib/stripe";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

// Features comparison matching the pricing page
const features = [
  {
    label: "Growth Routes",
    free: "1 route (AI-matched)",
    premium: "All 3 routes",
  },
  {
    label: "AI Matching & Predictions",
    free: "Basic compatibility",
    premium: "Unlimited + success scores",
  },
  {
    label: "Queue Access",
    free: "20 creators/day",
    premium: "Unlimited",
  },
  {
    label: "Active Submissions",
    free: "3 at once",
    premium: "Unlimited",
  },
  {
    label: "Icebreakers",
    free: "Generic templates",
    premium: "Unlimited AI-personalized",
  },
  {
    label: "Profile Analysis",
    free: "Basic (1x/month)",
    premium: "Deep AI analysis anytime",
  },
  {
    label: "Analytics",
    free: "Basic stats",
    premium: "Advanced dashboard + trends",
  },
  {
    label: "Tokens",
    free: "100 starting",
    premium: "100 starting + 200/month",
  },
  {
    label: "Messages",
    free: "5 new chats/day",
    premium: "Unlimited",
  },
  {
    label: "Group Features",
    free: "Join 2 groups (manual scheduling)",
    premium: "Create & join unlimited (AI scheduling)",
  },
  {
    label: "Priority Boost",
    free: false,
    premium: true,
    premiumText: "25% boost in queues",
  },
];

const scrollbarStyles = `
  .premium-modal-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .premium-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
  }
  .premium-modal-scroll::-webkit-scrollbar-track {
    background: #f3f4f6;
  }
  .premium-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #f3f4f6;
  }
`;

export default function PremiumModal({
  isOpen,
  onClose,
  defaultTab = "premium",
}) {
  const { user, isPremium, refreshUser } = useContext(AuthContext);
  const { createCheckoutSession } = useApi();
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    if (isOpen) {
      setBillingCycle("monthly");
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    if (isPremium) {
      toast.info("You are already a Pro user.");
      return;
    }

    try {
      const data = await createCheckoutSession("premium", billingCycle);

      if (data.checkout_session_id) {
        const stripe = await stripePromise;
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
      console.error("Checkout error:", error);
      toast.error("An error occurred while processing your request.");
    }
  };

  const price = billingCycle === "monthly" ? "$29" : "$276";
  const period = billingCycle === "monthly" ? "month" : "year";
  const savings = billingCycle === "annual" ? "Save $72/year" : null;

  return (
    <>
      <style>{fontStyles}</style>
      <style>{scrollbarStyles}</style>
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
                <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl border-2 border-black bg-white shadow-2xl transition-all max-h-[90vh]">
                  {/* Header */}
                  <div className="relative flex items-center justify-between px-6 py-5 border-b-2 border-black bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                          Upgrade to Pro
                        </Dialog.Title>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Unlock unlimited AI-powered growth
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

                  {/* Body - Scrollable */}
                  <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto premium-modal-scroll">
                    {/* Plan Description */}
                    <div className="flex items-start gap-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                      <div className="flex-shrink-0 mt-0.5">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-1">
                          Pro Features
                        </h3>
                        <p className="text-sm text-purple-800 leading-relaxed">
                          Unlock all routes with unlimited AI-powered
                          collaboration. Get unlimited matching, predictions,
                          and access to advanced analytics to accelerate your
                          creator growth.
                        </p>
                      </div>
                    </div>

                    {/* Billing Cycle Toggle */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-gray-600" />
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                          Billing Cycle
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setBillingCycle("monthly")}
                          className={`relative px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl border-2 transition-all ${
                            billingCycle === "monthly"
                              ? "bg-black text-white border-black shadow-lg"
                              : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingCycle("annual")}
                          className={`relative px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl border-2 transition-all ${
                            billingCycle === "annual"
                              ? "bg-black text-white border-black shadow-lg"
                              : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          Annual
                          <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                            Save 20%
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Features Comparison */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="w-4 h-4 text-gray-600" />
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                          Feature Comparison
                        </label>
                      </div>
                      <div className="border-2 border-black rounded-xl overflow-hidden">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-900">
                            <tr>
                              <th className="px-4 py-3 text-left border-b-2 border-black font-bold uppercase text-xs text-white">
                                Feature
                              </th>
                              <th className="px-3 py-3 text-center border-l-2 border-b-2 border-black font-bold uppercase text-xs text-white">
                                Explorer
                              </th>
                              <th className="px-3 py-3 text-center border-l-2 border-b-2 border-black font-bold uppercase text-xs text-white">
                                Pro
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {features.map((f, idx) => (
                              <tr
                                key={idx}
                                className={idx % 2 ? "bg-gray-50" : "bg-white"}
                              >
                                <td className="px-4 py-3 border-b border-gray-200 text-xs font-medium">
                                  {f.label}
                                </td>
                                <td className="px-3 py-3 text-center border-l border-b border-gray-200">
                                  {f.free === false ? (
                                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                                  ) : (
                                    <span className="text-xs text-gray-600">
                                      {f.free}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center border-l border-b border-gray-200 bg-green-50">
                                  {f.premium === true ? (
                                    <div className="flex flex-col items-center">
                                      <Check className="h-5 w-5 text-green-600" />
                                      {f.premiumText && (
                                        <span className="text-xs text-gray-600 mt-1">
                                          {f.premiumText}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="font-bold text-xs text-green-700">
                                      {f.premium}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Value Proposition */}
                    <div className="p-4 bg-black text-white rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold uppercase tracking-wider mb-1">
                            No Hidden Fees
                          </h3>
                          <p className="text-sm leading-relaxed text-gray-300">
                            Unlike other platforms, we don't charge per AI query
                            or limit your matches. Pro gives you{" "}
                            <span className="font-bold text-white">
                              truly unlimited
                            </span>{" "}
                            access to all AI features.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary - Fixed at bottom */}
                  <div className="px-6 py-5 border-t-2 border-black bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-2xl font-extrabold uppercase tracking-tight text-gray-900">
                          Pro Plan
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          Unlimited AI features + all growth routes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-gray-900">
                          {price}
                          <span className="text-sm font-medium text-gray-600">
                            /{period}
                          </span>
                        </div>
                        {savings && (
                          <div className="text-xs text-green-600 font-bold mt-1 bg-green-100 inline-block px-2 py-1 rounded-full">
                            {savings}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <X className="w-4 h-4" />
                          Cancel
                        </span>
                      </button>
                      <button
                        onClick={handleUpgrade}
                        disabled={isPremium}
                        className={`px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl border-2 transition-all ${
                          isPremium
                            ? "bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed"
                            : "bg-black text-white border-black hover:bg-gray-900 hover:scale-105 shadow-lg"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4" />
                          {isPremium ? "Current Plan" : "Upgrade to Pro"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Cancel anytime • Instant access • No questions asked
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
