import React, { useState } from "react";
import {
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Zap,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Target,
  Brain,
} from "lucide-react";

// Quick Connect Post Card Demo Component
const QuickConnectPostDemo = () => {
  const mockRequest = {
    id: 1,
    title: "Need 5 Beta Testers for SaaS Platform",
    description:
      "Looking for experienced SaaS users to test our new project management tool. Need detailed feedback on UX, features, and pain points. 2-week commitment required.",
    category: "beta_testers",
    token_reward: 75,
    urgency: "normal",
    tags: ["saas", "ux-testing", "product-feedback"],
    requester: {
      name: "Alex Chen",
      username: "alexchen",
    },
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      beta_testers: "🧪",
      guest_posts: "✍️",
      advice: "💡",
      feedback: "💬",
      collaboration: "🤝",
      promotion: "📢",
      technical: "💻",
      design: "🎨",
      marketing: "📊",
      other: "🌟",
    };
    return emojis[category] || "🌟";
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "normal":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto font-mono bg-white border-2 border-black rounded-lg shadow-2xl overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * {
          font-family: 'Space Mono', monospace;
        }
      `}</style>

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black border-b-2 border-black">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="text-lg sm:text-xl">⚡</span>
            <span>Quick Connect Request</span>
          </h3>
          <span className="text-xs text-gray-300">Live Preview</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 bg-gray-50">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-black hover:shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="shrink-0 text-4xl">
                {getCategoryEmoji(mockRequest.category)}
              </span>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h4 className="break-words text-lg font-bold">
                    {mockRequest.title}
                  </h4>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${getUrgencyColor(
                      mockRequest.urgency,
                    )}`}
                  >
                    {mockRequest.urgency}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Posted by {mockRequest.requester.name}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1 text-2xl font-bold text-black">
                <Zap className="h-6 w-6 text-yellow-500" />
                {mockRequest.token_reward}
              </div>
              <div className="text-xs text-gray-500">tokens</div>
            </div>
          </div>

          <p className="mb-4 break-words text-gray-700">
            {mockRequest.description}
          </p>

          {mockRequest.tags && mockRequest.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {mockRequest.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-bold text-white transition opacity-75 cursor-not-allowed"
          >
            <MessageSquare className="h-5 w-5" />
            Offer Help
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            ✨ Interactive demo - Full features available in the app
          </p>
        </div>
      </div>
    </div>
  );
};

// Pool Feature Post Demo Component
const PoolFeaturePostDemo = () => {
  const mockContent = {
    id: 1,
    title: "10 Tips for Growing Your Audience Authentically in 2026",
    creator: "Sarah Chen",
    followers: 342,
    creatorBio:
      "Helping creators build genuine connections, not just followers",
    niche: "Creator Economy",
    mutualInterest: 87,
    why: "Both focused on authentic audience building and quality over quantity",
    description:
      "A practical guide to finding your first 100 true fans who actually engage with and share your content.",
    tags: ["audience-building", "creator-tips", "authenticity"],
    avatarColor: "bg-gray-800",
  };

  return (
    <div className="w-full max-w-3xl mx-auto font-mono bg-white border-2 border-black rounded-lg shadow-2xl overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * {
          font-family: 'Space Mono', monospace;
        }
      `}</style>

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black border-b-2 border-black">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="text-lg sm:text-xl">🎯</span>
            <span>Audience Pool Discovery</span>
          </h3>
          <span className="text-xs text-gray-300">Live Preview</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 bg-gray-50">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-black hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
              #1 in queue
            </span>
            <span className="text-2xl">
              {mockContent.mutualInterest >= 80 ? "🔥" : "✨"}
            </span>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-14 h-14 ${mockContent.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}
            >
              {mockContent.creator
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-base">{mockContent.creator}</h4>
                <span className="text-xs text-gray-500">
                  • {mockContent.followers} followers
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {mockContent.creatorBio}
              </p>
              <span className="inline-block bg-gray-100 text-black text-xs font-semibold px-3 py-1 rounded-full border border-gray-300">
                {mockContent.niche}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                AI Alignment Score
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {mockContent.mutualInterest}%
                </span>
                <span className="text-xl">🎯</span>
              </div>
            </div>
            <div className="bg-white rounded-full h-3 overflow-hidden mb-3 border-2 border-purple-300 shadow-inner">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${mockContent.mutualInterest}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 flex items-start gap-2">
              <Target className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              {mockContent.why}
            </p>
          </div>

          <div className="mb-4">
            <h5 className="font-bold text-base mb-2">{mockContent.title}</h5>
            <p className="text-sm text-gray-600 mb-3">
              {mockContent.description}
            </p>
            <div className="flex gap-2 flex-wrap">
              {mockContent.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-300 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <button
            disabled
            className="w-full bg-black text-white py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg opacity-75 cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Read & Give Feedback
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            ✨ Interactive demo - Full features available in the app
          </p>
        </div>
      </div>
    </div>
  );
};

// Collectives Browse Card Demo Component
const CollectivesBrowseCardDemo = () => {
  const mockGroup = {
    id: 1,
    name: "Tech Creators Collective",
    description:
      "A group of tech content creators helping each other grow through consistent, reciprocal sharing and support.",
    niche: "Technology",
    current_member_count: 6,
    max_members: 8,
    shares_per_week: 5,
    follower_range_min: 1000,
    follower_range_max: 10000,
  };

  return (
    <div className="w-full max-w-3xl mx-auto font-mono bg-white border-2 border-black rounded-lg shadow-2xl overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * {
          font-family: 'Space Mono', monospace;
        }
      `}</style>

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black border-b-2 border-black">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="text-lg sm:text-xl">🤝</span>
            <span>Creator Collectives</span>
          </h3>
          <span className="text-xs text-gray-300">Live Preview</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 bg-gray-50">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-black hover:shadow-xl transition">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">{mockGroup.name}</h3>
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold">
                  #{mockGroup.niche}
                </span>
              </div>
              <p className="text-gray-600">{mockGroup.description}</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Members</span>
              <span className="font-bold">
                {mockGroup.current_member_count}/{mockGroup.max_members}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{
                  width: `${
                    (mockGroup.current_member_count / mockGroup.max_members) *
                    100
                  }%`,
                }}
              />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {mockGroup.shares_per_week}x/week
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {mockGroup.follower_range_min?.toLocaleString()}-
                {mockGroup.follower_range_max?.toLocaleString()} followers
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-bold text-gray-700 transition opacity-75 cursor-not-allowed"
            >
              View Details
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-bold text-white transition opacity-75 cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              Join Group
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            ✨ Interactive demo - Full features available in the app
          </p>
        </div>
      </div>
    </div>
  );
};

// Feature Section
const FeatureSection = () => {
  return (
    <section className="w-full bg-white py-24 md:py-32">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 mb-16 sm:mb-24 md:mb-32">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 text-center leading-tight mb-6 sm:mb-8">
          Everything you need to <br />
          <span className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 text-transparent bg-clip-text">
            grow as a creator.
          </span>
        </h2>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 space-y-24 sm:space-y-32 md:space-y-48">
        {/* Feature 1 - Audience Pool */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="flex items-start mb-4 sm:mb-6">
              <div className="w-1.5 sm:w-2 h-8 sm:h-10 bg-gradient-to-b from-gray-800 to-gray-400 rounded-full mr-4 sm:mr-6"></div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Find Your First 100 True Fans
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-700">
                    AI-Powered Matching
                  </span>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-4 sm:mb-6">
                  Discover aligned creators, get genuine feedback, and build
                  real connections. Quality over quantity—find people who
                  actually care about your work.
                </p>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl flex-shrink-0">✓</span>
                    <span>
                      <strong>Smart AI matching</strong> with creators at
                      similar growth stages based on content quality and
                      engagement patterns
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">✓</span>
                    <span>
                      <strong>AI Insights tab</strong> analyzes your activity to
                      surface best collaboration opportunities
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">✓</span>
                    <span>
                      Give and receive honest feedback on content to build
                      genuine relationships
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <PoolFeaturePostDemo />
          </div>
        </div>

        {/* Feature 2 - Creator Collaboration */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="order-2 min-w-0">
            <div className="flex items-start mb-6">
              <div className="w-2 h-10 bg-gradient-to-b from-gray-800 to-gray-400 rounded-full mr-6"></div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Team Up in Creator Collectives
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-full mb-4">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-700">
                    AI Group Matching
                  </span>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-4 sm:mb-6 break-words">
                  Join small, matched groups of 4-8 creators for structured
                  reciprocal support. AI matches you with ideal partners in your
                  niche and growth stage.
                </p>
                <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">✓</span>
                    <span>
                      <strong>AI analyzes compatibility</strong> based on
                      content style, audience overlap, and collaboration history
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">✓</span>
                    <span>
                      Rotating schedule ensures everyone gets equal promotion
                      with automated tracking
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">✓</span>
                    <span>
                      Build reliability score and unlock better collaboration
                      opportunities
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="order-1 min-w-0">
            <CollectivesBrowseCardDemo />
          </div>
        </div>

        {/* Feature 3 - Quick Connects */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="flex items-start mb-4 sm:mb-6">
              <div className="w-1.5 sm:w-2 h-8 sm:h-10 bg-gradient-to-b from-gray-800 to-gray-400 rounded-full mr-4 sm:mr-6"></div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Get Help Fast with Quick Connects
                  </h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-4 sm:mb-6">
                  Need beta testers, feedback, or collaboration? Post requests
                  with token rewards and get matched with helpers instantly. A
                  reputation-based marketplace for creator support.
                </p>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl flex-shrink-0">✓</span>
                    <span>
                      Post requests for beta testing, guest posts, advice,
                      feedback, and more
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">✓</span>
                    <span>
                      Token-based rewards ensure quality help and build
                      reputation through ratings
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">✓</span>
                    <span>
                      Fast turnaround with motivated creators ready to help for
                      mutual benefit
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <QuickConnectPostDemo />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
