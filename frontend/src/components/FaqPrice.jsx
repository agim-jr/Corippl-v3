import React, { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

const faqs = [
  {
    question: "What is Corippl?",
    answer:
      "Corippl is a modern platform for creators to connect, collaborate, and grow through three strategic paths: Audience Pool for content sharing, Collectives for group collaboration, and Quick Connects for direct partnerships.",
  },
  {
    question: "How do I join?",
    answer:
      "Click the 'Get Started' button on our website and follow the simple registration steps to create your account. You'll start with Guided Growth (free) and can upgrade as you grow.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes! Guided Growth is completely free and gives you access to one AI-matched growth route. Multi-Path Pro and Creator Studio are paid plans that unlock all routes and advanced features.",
  },
  {
    question: "How does payment work? Can I cancel?",
    answer: (
      <span>
        All paid plan payments are securely processed via <b>Stripe</b>. You can
        upgrade or cancel anytime from your dashboard -- no long-term contracts
        or hidden fees. If you decide to cancel, your premium access will remain
        until the end of your billing period.
      </span>
    ),
  },
  {
    question: "What's the difference between the plans?",
    answer: (
      <div>
        <div className="mb-2 text-gray-700">
          Here's a quick comparison of our three plans:
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm text-left">
            <thead>
              <tr>
                <th className="px-2 py-2 font-bold text-gray-900">Feature</th>
                <th className="px-2 py-2 font-bold text-gray-900 text-center">
                  Guided Growth
                </th>
                <th className="px-2 py-2 font-bold text-gray-900 text-center">
                  Multi-Path Pro
                </th>
                <th className="px-2 py-2 font-bold text-gray-900 text-center">
                  Creator Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                // ========================================
                // SECTION: ACCESS & ROUTES
                // ========================================
                {
                  label: "ACCESS & ROUTES",
                  free: "",
                  pro: "",
                  studio: "",
                  isHeader: true,
                },
                {
                  label: "Growth Routes",
                  free: "1 AI-MATCHED",
                  pro: "ALL 3 ROUTES",
                  studio: "ALL 3 ROUTES",
                },
                {
                  label: "Audience Pool",
                  free: "IF MATCHED",
                  pro: "FULL ACCESS",
                  studio: "FULL ACCESS",
                },
                {
                  label: "Collectives",
                  free: "IF MATCHED",
                  pro: "FULL ACCESS",
                  studio: "FULL ACCESS",
                },
                {
                  label: "Quick Connects",
                  free: "IF MATCHED",
                  pro: "FULL ACCESS",
                  studio: "FULL ACCESS",
                },

                // ========================================
                // SECTION: AI PROFILE & MATCHING
                // ========================================
                {
                  label: "AI PROFILE & MATCHING",
                  free: "",
                  pro: "",
                  studio: "",
                  isHeader: true,
                },
                {
                  label: "AI Profile Analysis",
                  free: "BASIC (1 TOPIC)",
                  pro: "ENHANCED (5+ TOPICS)",
                  studio: "CUSTOM TRAINING",
                },
                {
                  label: "Match Predictions",
                  free: false,
                  pro: "3 PER DAY",
                  studio: "UNLIMITED",
                },
                {
                  label: "Success Scoring",
                  free: false,
                  pro: true,
                  studio: true,
                },
                {
                  label: "Priority Matching",
                  free: false,
                  pro: false,
                  studio: true,
                },

                // ========================================
                // SECTION: ENGAGEMENT TOOLS
                // ========================================
                {
                  label: "ENGAGEMENT TOOLS",
                  free: "",
                  pro: "",
                  studio: "",
                  isHeader: true,
                },
                {
                  label: "Icebreaker Messages",
                  free: "3 TEMPLATES/MO",
                  pro: "PERSONALIZED",
                  studio: "HYPER-PERSONALIZED",
                },
                {
                  label: "Content References",
                  free: false,
                  pro: true,
                  studio: true,
                },
                {
                  label: "A/B Testing",
                  free: false,
                  pro: false,
                  studio: true,
                },
                {
                  label: "Message Predictions",
                  free: false,
                  pro: false,
                  studio: true,
                },

                // ========================================
                // SECTION: COLLECTIVE MANAGEMENT
                // ========================================
                {
                  label: "COLLECTIVE MANAGEMENT",
                  free: "",
                  pro: "",
                  studio: "",
                  isHeader: true,
                },
                {
                  label: "Activity Tracking",
                  free: "WEEKLY SUMMARY",
                  pro: "SMART ALERTS",
                  studio: "REAL-TIME",
                },
                {
                  label: "Engagement Scoring",
                  free: false,
                  pro: true,
                  studio: true,
                },
                {
                  label: "Automated Check-ins",
                  free: false,
                  pro: false,
                  studio: true,
                },
                {
                  label: "AI Meeting Scheduler",
                  free: false,
                  pro: false,
                  studio: true,
                },

                // ========================================
                // SECTION: HELP EXCHANGE
                // ========================================
                {
                  label: "HELP EXCHANGE",
                  free: "",
                  pro: "",
                  studio: "",
                  isHeader: true,
                },
                {
                  label: "Monthly Tokens",
                  free: "10 TOKENS",
                  pro: "100 TOKENS",
                  studio: "UNLIMITED",
                },
                {
                  label: "Request Categorization",
                  free: "MANUAL",
                  pro: "AI AUTOMATED",
                  studio: "AI AUTOMATED",
                },
                {
                  label: "Skill Detection",
                  free: false,
                  pro: true,
                  studio: true,
                },
                {
                  label: "Priority Routing",
                  free: false,
                  pro: false,
                  studio: true,
                },

                // ========================================
                // SECTION: ANALYTICS
                // ========================================
                {
                  label: "ANALYTICS & REPORTS",
                  free: "",
                  pro: "",
                  studio: "",
                  isHeader: true,
                },
                {
                  label: "Performance Reports",
                  free: false,
                  pro: "WEEKLY AI",
                  studio: "DAILY AI",
                },
                {
                  label: "PDF Export",
                  free: false,
                  pro: false,
                  studio: true,
                },
                {
                  label: "Predictive Insights",
                  free: false,
                  pro: false,
                  studio: true,
                },
                {
                  label: "Trend Forecasting",
                  free: false,
                  pro: true,
                  studio: true,
                },
              ].map((row, index) => {
                // Header row styling
                if (row.isHeader) {
                  return (
                    <tr key={`header-${index}`} className="bg-gray-100">
                      <td
                        colSpan={4}
                        className="py-2 px-2 font-bold text-xs text-gray-700 uppercase tracking-wide"
                      >
                        {row.label}
                      </td>
                    </tr>
                  );
                }

                // Regular feature row
                return (
                  <tr key={row.label} className="bg-white even:bg-gray-50">
                    <td className="py-2 px-2">{row.label}</td>
                    <td className="py-2 px-2 text-center">
                      {row.free === true && (
                        <CheckIcon className="h-5 w-5 text-green-500 inline" />
                      )}
                      {row.free === false && (
                        <XMarkIcon className="h-5 w-5 text-gray-300 inline" />
                      )}
                      {typeof row.free === "string" && (
                        <span className="font-bold text-xs">{row.free}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {row.pro === true && (
                        <CheckIcon className="h-5 w-5 text-blue-600 inline" />
                      )}
                      {row.pro === false && (
                        <XMarkIcon className="h-5 w-5 text-gray-300 inline" />
                      )}
                      {typeof row.pro === "string" && (
                        <span className="text-blue-600 font-bold text-xs">
                          {row.pro}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {row.studio === true && (
                        <CheckIcon className="h-5 w-5 text-gray-900 inline" />
                      )}
                      {row.studio === false && (
                        <XMarkIcon className="h-5 w-5 text-gray-300 inline" />
                      )}
                      {typeof row.studio === "string" && (
                        <span className="text-gray-900 font-bold text-xs">
                          {row.studio}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Guided Growth lets you explore with one AI-matched route and basic
          tools. Multi-Path Pro unlocks all three growth routes with enhanced AI
          and 100 monthly tokens. Creator Studio adds unlimited automation,
          custom AI training, and priority features.
        </div>
      </div>
    ),
  },
  {
    question: "What are the three growth routes?",
    answer: (
      <div>
        <p className="mb-2">
          Corippl offers three strategic paths to grow your creator presence:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-2">
          <li>
            <b>Audience Pool:</b> Share and discover content through reciprocal
            promotion with other creators in your niche
          </li>
          <li>
            <b>Collectives:</b> Join or create groups of creators for ongoing
            collaboration, accountability, and mutual support
          </li>
          <li>
            <b>Quick Connects:</b> Make direct 1-on-1 partnerships for specific
            projects, cross-promotions, or skill exchanges
          </li>
        </ul>
        <p>
          Guided Growth (free) gives you access to one route chosen by our AI
          based on your profile. Multi-Path Pro and Creator Studio unlock all
          three routes so you can grow through multiple channels simultaneously.
        </p>
      </div>
    ),
  },
  {
    question: "What is Creator Studio and how does it work?",
    answer: (
      <div>
        <p className="mb-2">
          Creator Studio is our most advanced plan that uses AI automation to
          maximize your growth across all three routes. When you subscribe to
          Creator Studio, you get:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li>
            <b>Unlimited tokens</b> in the Help Exchange system to request and
            offer assistance
          </li>
          <li>
            <b>Custom AI training</b> on your specific niche, topics, and
            creator goals
          </li>
          <li>
            <b>Priority matching</b> that places you at the front of discovery
            queues
          </li>
          <li>
            <b>Automated check-ins</b> and meeting scheduling for your
            Collectives
          </li>
          <li>
            <b>Hyper-personalized icebreakers</b> with A/B testing and success
            predictions
          </li>
          <li>
            <b>Daily AI reports</b> with predictive insights and trend
            forecasting
          </li>
        </ul>
        <p>
          Creator Studio is perfect for serious creators who want to save time
          while maximizing their reach and impact across all growth channels.
        </p>
      </div>
    ),
  },
  {
    question: "How does the Help Exchange system work?",
    answer: (
      <div>
        <p className="mb-2">
          The Help Exchange is Corippl's token-based system for requesting and
          offering help within your community. Here's how it works:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li>
            You receive monthly tokens based on your plan: 10 (Guided Growth),
            100 (Multi-Path Pro), or unlimited (Creator Studio)
          </li>
          <li>
            Spend tokens to request help like feedback, promotion, skills, or
            collaboration
          </li>
          <li>
            Earn tokens by fulfilling requests from other creators in your
            network
          </li>
          <li>
            AI automatically categorizes requests and detects relevant skills on
            Pro and Studio plans
          </li>
        </ul>
        <p>
          The token economy ensures fair value exchange while building a
          supportive creator community where everyone contributes and benefits.
        </p>
      </div>
    ),
  },
];

const FaqPrice = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section className="bg-white py-16 px-4">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-6">
          {faqs.map((faq, idx) => (
            <div
              key={faq.question}
              className={`rounded-xl shadow-sm transition-all bg-gray-50 ${
                openIndex === idx ? "ring-2 ring-black ring-opacity-40" : ""
              }`}
            >
              <dt>
                <button
                  aria-expanded={openIndex === idx}
                  aria-controls={`faq-${idx}-content`}
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between px-6 py-5 text-lg font-semibold text-left text-gray-800 focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className={`h-5 w-5 flex-shrink-0 ${
                        openIndex === idx ? "text-black" : "text-gray-400"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M12 8v4m0 4h.01"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {faq.question}
                  </span>
                  <span
                    className="ml-4 transition-transform duration-200"
                    style={{
                      transform:
                        openIndex === idx ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M9 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </dt>
              <dd
                id={`faq-${idx}-content`}
                className={`px-6 pb-5 text-gray-600 text-base transition-all duration-200 ${
                  openIndex === idx ? "block animate-fadeIn" : "hidden"
                }`}
              >
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {/* FadeIn animation */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </section>
  );
};

export default FaqPrice;
