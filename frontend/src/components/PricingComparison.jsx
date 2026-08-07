import React from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

const features = [
  // ACCESS & ROUTES
  { label: "ACCESS & ROUTES", free: "", pro: "", studio: "", isHeader: true },
  {
    label: "Growth Routes Access",
    free: "1 Route (AI-matched)",
    pro: "All 3 Routes",
    studio: "All 3 Routes",
  },
  {
    label: "Audience Pool",
    free: "If Matched",
    pro: "Full Access",
    studio: "Full Access",
  },
  {
    label: "Collectives",
    free: "If Matched",
    pro: "Full Access",
    studio: "Full Access",
  },
  {
    label: "Quick Connects",
    free: "If Matched",
    pro: "Full Access",
    studio: "Full Access",
  },

  // AI PROFILE & MATCHING
  {
    label: "AI PROFILE & MATCHING",
    free: "",
    pro: "",
    studio: "",
    isHeader: true,
  },
  {
    label: "AI Profile Analyzer",
    free: "Basic (1 topic)",
    pro: "Enhanced (5+ topics)",
    studio: "Custom Training",
  },
  {
    label: "Match Predictions",
    free: false,
    pro: "3 per day",
    studio: "Unlimited",
  },
  {
    label: "Success Likelihood Scoring",
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

  // ENGAGEMENT TOOLS
  {
    label: "ENGAGEMENT TOOLS",
    free: "",
    pro: "",
    studio: "",
    isHeader: true,
  },
  {
    label: "Icebreaker Messages",
    free: "3 templates/mo",
    pro: "Personalized",
    studio: "Hyper-Personalized",
  },
  {
    label: "Content References in Messages",
    free: false,
    pro: true,
    studio: true,
  },
  {
    label: "A/B Message Testing",
    free: false,
    pro: false,
    studio: true,
  },
  {
    label: "Message Success Predictions",
    free: false,
    pro: false,
    studio: true,
  },

  // COLLECTIVE MANAGEMENT
  {
    label: "COLLECTIVE MANAGEMENT",
    free: "",
    pro: "",
    studio: "",
    isHeader: true,
  },
  {
    label: "Activity Tracking",
    free: "Weekly Summary",
    pro: "Smart Alerts",
    studio: "Real-time Monitoring",
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
  {
    label: "Meeting Agendas & Summaries",
    free: false,
    pro: false,
    studio: true,
  },

  // HELP EXCHANGE SYSTEM
  {
    label: "HELP EXCHANGE SYSTEM",
    free: "",
    pro: "",
    studio: "",
    isHeader: true,
  },
  {
    label: "Monthly Tokens",
    free: "10 tokens",
    pro: "100 tokens",
    studio: "Unlimited",
  },
  {
    label: "Request Categorization",
    free: "Manual",
    pro: "AI Automated",
    studio: "AI Automated",
  },
  {
    label: "Skill Detection",
    free: false,
    pro: true,
    studio: true,
  },
  {
    label: "Priority Request Routing",
    free: false,
    pro: false,
    studio: true,
  },
  {
    label: "Dynamic Token Pricing",
    free: false,
    pro: false,
    studio: true,
  },

  // ANALYTICS & REPORTS
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
    pro: "Weekly AI Reports",
    studio: "Daily AI Reports",
  },
  {
    label: "PDF Export",
    free: false,
    pro: false,
    studio: true,
  },
  {
    label: "Comparative Analysis",
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
];

const PricingComparison = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 sm:py-24 animate-fadeInSection">
      {/* Section Header */}
      <div className="mx-auto max-w-2xl text-center mb-12">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-4">
          Compare Plans
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          Feature Breakdown
        </h2>
        <p className="text-lg text-gray-600">
          See exactly what you get with each tier. From guided growth to
          unlimited AI automation.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="border-2 border-gray-900 rounded-2xl overflow-hidden shadow-xl bg-white">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider text-white">
                  Features
                </th>
                <th className="px-6 py-4 text-center text-sm font-black uppercase tracking-wider text-white border-l-2 border-gray-700">
                  Guided Growth
                </th>
                <th className="px-6 py-4 text-center text-sm font-black uppercase tracking-wider text-white border-l-2 border-gray-700 bg-blue-600">
                  Multi-Path Pro
                </th>
                <th className="px-6 py-4 text-center text-sm font-black uppercase tracking-wider text-white border-l-2 border-gray-700">
                  Creator Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => {
                if (feature.isHeader) {
                  return (
                    <tr key={`header-${idx}`} className="bg-gray-100">
                      <td
                        colSpan={4}
                        className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-900 border-t-2 border-gray-200"
                      >
                        {feature.label}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={`feature-${idx}`}
                    className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {feature.label}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-gray-200">
                      {renderCell(feature.free)}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-gray-200 bg-blue-50/30">
                      {renderCell(feature.pro)}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-gray-200">
                      {renderCell(feature.studio)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6 p-4">
          {["free", "pro", "studio"].map((plan) => (
            <div
              key={plan}
              className={`border-2 rounded-xl p-4 ${
                plan === "pro"
                  ? "border-blue-600 bg-blue-50"
                  : plan === "studio"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-300 bg-white"
              }`}
            >
              <h3 className="text-lg font-black uppercase mb-4 text-center">
                {plan === "free"
                  ? "Guided Growth"
                  : plan === "pro"
                    ? "Multi-Path Pro"
                    : "Creator Studio"}
              </h3>
              <div className="space-y-2">
                {features
                  .filter((f) => !f.isHeader)
                  .map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                    >
                      <span className="text-xs font-medium text-gray-700">
                        {feature.label}
                      </span>
                      <span>{renderCell(feature[plan])}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 font-medium">
          All plans include access to the community and basic support.{" "}
          <span className="font-bold text-gray-900">
            No hidden fees. Cancel anytime.
          </span>
        </p>
      </div>
    </div>
  );
};

// Helper function to render cell content
const renderCell = (value) => {
  if (value === true) {
    return <CheckIcon className="h-5 w-5 text-green-600 mx-auto" />;
  }
  if (value === false) {
    return <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return (
      <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
        {value}
      </span>
    );
  }
  return <span className="text-gray-300">—</span>;
};

export default PricingComparison;
