import React, { useState } from "react";
import {
  Users,
  Zap,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle,
  Rocket,
  BarChart3,
  Mail,
  Youtube,
  Mic,
  Share2,
  Eye,
  RefreshCw,
  Send,
  Heart,
  Headphones,
  Sparkles,
  Link2,
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHelmet from "./SEOHelmet";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

function PromotePage() {
  const [activeTab, setActiveTab] = useState("newsletter");

  const platforms = [
    { id: "newsletter", name: "Newsletter", icon: Mail },
    { id: "youtube", name: "YouTube", icon: Youtube },
    { id: "podcast", name: "Podcast", icon: Mic },
  ];

  const contentTypeGuides = {
    newsletter: {
      title: "Newsletter Promotion Through Cross-Sharing",
      subtitle: "Grow your subscriber base by sharing other newsletters",
      benefits: [
        {
          icon: Send,
          title: "Reach Engaged Readers",
          description:
            "Get your newsletter shared by creators whose audiences are actively reading and engaging with similar content.",
        },
        {
          icon: Users,
          title: "Build Your List Organically",
          description:
            "Attract quality subscribers who discover you through trusted recommendations, not paid ads.",
        },
        {
          icon: Target,
          title: "Niche-Specific Matching",
          description:
            "Get paired with newsletters in your niche—tech, marketing, finance, lifestyle, and more.",
        },
      ],
      howItWorks: [
        {
          step: "Submit Your Newsletter",
          description:
            "Add your latest newsletter issue or sign-up page to Corippl's queue.",
        },
        {
          step: "Share Matched Newsletters",
          description:
            "Receive newsletters matched to your niche. Feature them in your issues, social media, or community.",
        },
        {
          step: "Your Newsletter Gets Shared",
          description:
            "Other newsletter creators share your content with their subscribers, driving new sign-ups.",
        },
      ],
      sharingIdeas: [
        "Feature in a 'Recommended Reading' section",
        "Share in your welcome email sequence",
        "Post on your newsletter's social media channels",
        "Include in your community or forum spaces",
      ],
      cta: "Start Growing Your Newsletter",
    },
    youtube: {
      title: "YouTube Channel Growth Through Reciprocal Sharing",
      subtitle: "Gain subscribers by cross-promoting with other creators",
      benefits: [
        {
          icon: Eye,
          title: "Increase Video Views",
          description:
            "Get your videos shared by creators with engaged audiences interested in your content type.",
        },
        {
          icon: TrendingUp,
          title: "Grow Your Subscriber Count",
          description:
            "Attract subscribers organically through authentic recommendations from fellow creators.",
        },
        {
          icon: Target,
          title: "Category-Based Matching",
          description:
            "Get paired with channels in your category—education, gaming, vlogs, tutorials, reviews, and more.",
        },
      ],
      howItWorks: [
        {
          step: "Submit Your Video",
          description:
            "Add your latest YouTube video or channel to Corippl's queue.",
        },
        {
          step: "Share Matched Videos",
          description:
            "Receive videos matched to your niche. Share them in descriptions, community posts, or social media.",
        },
        {
          step: "Your Videos Get Shared",
          description:
            "Other YouTubers promote your content, bringing new viewers to your channel.",
        },
      ],
      sharingIdeas: [
        "Add to video descriptions as recommended content",
        "Create community tab posts featuring matched videos",
        "Share on Twitter, Instagram, or TikTok",
        "Mention in end screens or video outros",
      ],
      cta: "Start Growing Your Channel",
    },
    podcast: {
      title: "Podcast Promotion Through Cross-Sharing",
      subtitle: "Expand your listener base by sharing other podcasts",
      benefits: [
        {
          icon: Headphones,
          title: "Reach Active Listeners",
          description:
            "Get your podcast shared by creators whose audiences are actively listening to similar shows.",
        },
        {
          icon: Heart,
          title: "Build a Loyal Audience",
          description:
            "Attract engaged listeners who discover you through trusted recommendations from fellow podcasters.",
        },
        {
          icon: Target,
          title: "Genre-Specific Matching",
          description:
            "Get paired with podcasts in your genre—business, true crime, comedy, education, and more.",
        },
      ],
      howItWorks: [
        {
          step: "Submit Your Episode",
          description:
            "Add your latest podcast episode or show to Corippl's queue.",
        },
        {
          step: "Share Matched Podcasts",
          description:
            "Receive podcasts matched to your niche. Feature them in show notes, social media, or newsletters.",
        },
        {
          step: "Your Podcast Gets Shared",
          description:
            "Other podcasters promote your show, bringing new listeners to your episodes.",
        },
      ],
      sharingIdeas: [
        "Include in your episode show notes",
        "Mention in pre-roll or post-roll segments",
        "Share on your podcast's social media",
        "Feature in your podcast newsletter",
      ],
      cta: "Start Growing Your Podcast",
    },
  };

  const faqs = [
    {
      q: "What is Corippl?",
      a: "Corippl is a suite of three interconnected tools designed to help creators grow through authentic collaboration. Start in the Audience Pool (0-100 followers), graduate to Creator Collectives (50+ followers), and use Quick Connects whenever you need immediate help.",
    },
    {
      q: "What is 'The Audience Pool'?",
      a: "The Audience Pool is Corippl's content exchange network for creators just starting out (0-100 followers). Get matched with creators building similar audiences, discover genuine connections, and find your first 100 true fans through smart niche matching and free, authentic engagement.",
    },
    {
      q: "What are Creator Collectives?",
      a: "Creator Collectives are small, AI-matched groups (4-8 members) for creators with 50+ followers. Join structured groups for reciprocal support with automated schedules, rotating assignments, and verification to keep everyone accountable as you grow together.",
    },
    {
      q: "What are Quick Connects?",
      a: "Quick Connects is available to all creators regardless of follower count. Request help or offer expertise, earn tokens by helping others, and spend tokens to get community support. Perfect for getting beta testers, advice, or building your reputation.",
    },
    {
      q: "How do the three tools work together?",
      a: "Start in the Audience Pool to build your first 100 followers through authentic engagement. As you grow past 50 followers, join Creator Collectives for structured group support. Use Quick Connects at any stage when you need immediate help or want to offer your expertise.",
    },
    {
      q: "Do I need to use all three tools?",
      a: "No! Each tool is designed for different stages and needs. Start with the one that matches where you are now. Many creators begin with the Pool, graduate to Collectives as they grow, and use Quick Connects throughout their journey.",
    },
    {
      q: "How does Pool matching work?",
      a: "Our AI analyzes your niche, audience size, content quality, and engagement history to match you with relevant creators. You'll only be paired with content that makes sense for your audience, and vice versa.",
    },
    {
      q: "How is this different from paid advertising?",
      a: "Corippl focuses on authentic collaboration, not paid promotion. You grow through reciprocal sharing, structured group support, and community help—not algorithms or ad budgets. It's about building real connections with fellow creators.",
    },
  ];

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const activeGuide = contentTypeGuides[activeTab];

  return (
    <>
      <style>{fontStyles}</style>
      <SEOHelmet
        title="Grow Through Authentic Collaboration | Corippl Creator Tools"
        description="Corippl is a suite of three tools for creators: Audience Pool for starting out (0-100 followers), Creator Collectives for growing (50+), and Quick Connects for immediate help. No ads, just authentic collaboration."
        keywords="creator tools, audience growth, content collaboration, creator collectives, audience pool, quick connects, newsletter growth, youtube promotion, podcast promotion, creator community"
        url="https://www.corippl.com/promote"
      />

      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        {/* Dotted background overlay */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col flex-1">
          <Navbar />

          {/* Hero Section */}
          <div className="relative px-4 sm:px-6 pt-20 sm:pt-28 pb-12 sm:pb-16 max-w-6xl mx-auto w-full">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 mb-6 text-sm font-medium">
                <Rocket className="w-4 h-4" />
                <span>Three Tools, One Growth Journey</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Grow Through Authentic
                <span className="block mt-2">Collaboration</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Corippl is a suite of three tools that help you grow—no matter
                where you're starting from. Start in the Pool, graduate to
                Collectives, and use Quick Connects whenever you need immediate
                help.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() =>
                    document
                      .getElementById("three-tools")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-white border-2 border-black text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all"
                >
                  See How It Works
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Free to Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">No Ad Spend</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Authentic Growth</span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Tools Section */}
          <div
            id="three-tools"
            className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Three Tools That Work Together
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Each tool is designed for a different stage of your journey.
                Start where you are, grow at your pace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Audience Pool */}
              <div className="bg-black text-white rounded-2xl p-8 shadow-xl border-2 border-gray-700 hover:border-green-400 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-xl font-bold">Audience Pool</h3>
                </div>

                <div className="bg-green-900/50 border-2 border-green-700 rounded-lg px-3 py-1.5 mb-4 inline-block">
                  <p className="text-xs font-bold text-green-200">
                    🌱 STARTING (0-100 followers)
                  </p>
                </div>

                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  Get matched with creators building similar audiences. Discover
                  genuine connections and find your first 100 true fans through
                  smart niche matching.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Smart content matching</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Free & authentic engagement</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Find collaboration partners</span>
                  </div>
                </div>

                <Link
                  to="/signup"
                  className="flex items-center text-sm font-bold gap-1.5 text-green-400 hover:gap-2 transition-all"
                >
                  Start in the Pool <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Creator Collectives */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-orange-200 hover:border-orange-500 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Collectives</h3>
                </div>

                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg px-3 py-1.5 mb-4 inline-block">
                  <p className="text-xs font-bold text-orange-800">
                    🤝 GROWING (50+ followers)
                  </p>
                </div>

                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  Join small, AI-matched groups (4-8 members) for structured
                  reciprocal support. Automated schedules and tracking keep
                  everyone accountable.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>AI-matched groups</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Rotating schedules & verification</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Structured accountability</span>
                  </div>
                </div>

                <Link
                  to="/signup"
                  className="flex items-center text-sm font-bold gap-1.5 text-orange-600 hover:gap-2 transition-all"
                >
                  Join Collectives <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Quick Connects */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-200 hover:border-purple-500 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Quick Connects</h3>
                </div>

                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg px-3 py-1.5 mb-4 inline-block">
                  <p className="text-xs font-bold text-purple-800">
                    🚀 ALL LEVELS
                  </p>
                </div>

                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  Request help or offer expertise. Earn tokens by helping
                  others, spend tokens to get community support whenever you
                  need it.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>Request beta testers & advice</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>Build reputation & earn tokens</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>On-demand community help</span>
                  </div>
                </div>

                <Link
                  to="/signup"
                  className="flex items-center text-sm font-bold gap-1.5 text-purple-600 hover:gap-2 transition-all"
                >
                  Start Connecting <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Connection Visual */}
            <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="bg-green-400 text-black px-4 py-2 rounded-full font-bold text-sm">
                  Pool
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="bg-orange-400 text-white px-4 py-2 rounded-full font-bold text-sm">
                  Collectives
                </div>
                <Link2 className="w-6 h-6 text-gray-400" />
                <div className="bg-purple-400 text-white px-4 py-2 rounded-full font-bold text-sm">
                  Quick Connects
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Start where you are, use what you need, grow at your pace
              </p>
            </div>
          </div>

          {/* Deep Dive: Audience Pool */}
          <div className="bg-gradient-to-br from-gray-900 to-black text-white py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-green-400 text-black rounded-full px-4 py-2 mb-6 text-sm font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>The Audience Pool</span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Your Starting Point: Content Exchange Network
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  The Pool is where creators just starting out (0-100 followers)
                  get matched for reciprocal content sharing. No ads, no
                  algorithms—just authentic collaboration.
                </p>
              </div>

              {/* How Pool Works Visual */}
              <div className="bg-gray-800 rounded-2xl p-8 mb-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center">
                    <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Share2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">You Share</h3>
                    <p className="text-gray-300 text-sm">
                      Share others' content on your platforms
                    </p>
                  </div>

                  <div className="hidden md:block">
                    <RefreshCw className="w-8 h-8 text-gray-600" />
                  </div>

                  <div className="flex-1 text-center">
                    <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">You Get Shared</h3>
                    <p className="text-gray-300 text-sm">
                      Your content reaches new audiences
                    </p>
                  </div>
                </div>
              </div>

              {/* Pool Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Smart Niche Matching
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Get paired with creators in your niche—tech, marketing,
                    SaaS, finance, lifestyle. Your content only goes to relevant
                    audiences.
                  </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Zero Ad Spend
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Grow through authentic cross-promotion. No paid ads, no
                    complex campaigns—just share and be shared.
                  </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Fair & Reciprocal
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Share 1 piece of content, get 1 share back. Everyone
                    contributes equally in this collaborative ecosystem.
                  </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Simple Link Sharing
                  </h4>
                  <p className="text-gray-300 text-sm">
                    No complicated integrations. Just copy a link and share it
                    on your existing platforms.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-green-400 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-green-300 transition-all transform hover:scale-105 shadow-lg"
                >
                  Join The Pool Free <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="mt-4 text-sm text-gray-400">
                  1 free share to test the system • No credit card required
                </p>
              </div>
            </div>
          </div>

          {/* Content Type Guides Section */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Perfect for Newsletters, YouTube & Podcasts
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Corippl supports cross-promotion for all major content types
              </p>

              {/* Platform Tabs */}
              <div className="flex justify-center gap-4 mb-12 flex-wrap">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setActiveTab(platform.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                        activeTab === platform.id
                          ? "bg-black text-white shadow-lg"
                          : "bg-white text-gray-600 border-2 border-gray-200 hover:border-black"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {platform.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Guide Content */}
            <div className="space-y-12">
              {/* Title Section */}
              <div className="text-center">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  {activeGuide.title}
                </h3>
                <p className="text-lg text-gray-600">{activeGuide.subtitle}</p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeGuide.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200"
                  >
                    <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-black" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* How It Works */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  How It Works
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {activeGuide.howItWorks.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                        {index + 1}
                      </div>
                      <h5 className="font-bold text-gray-900 mb-2">
                        {item.step}
                      </h5>
                      <p className="text-gray-600 text-sm">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sharing Ideas */}
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  Ways to Share Matched Content
                </h4>
                <ul className="space-y-3">
                  {activeGuide.sharingIdeas.map((idea, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  {activeGuide.cta} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-50 py-12 sm:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Common Questions
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200"
                  >
                    <h3 className="text-lg font-bold mb-3 text-black">
                      {faq.q}
                    </h3>
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="bg-black text-white py-12 sm:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Ready to Start Growing?
              </h2>
              <p className="text-xl mb-8 text-gray-300">
                Join creators using Corippl's three-tool suite to grow through
                authentic collaboration
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
              >
                Get Started Free <ArrowRight className="w-6 h-6" />
              </Link>
              <p className="mt-6 text-sm text-gray-400">
                Start in the Pool • Graduate to Collectives • Use Quick Connects
                anytime
              </p>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
}

export default PromotePage;
