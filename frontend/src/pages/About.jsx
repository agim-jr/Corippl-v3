import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  User,
  Sparkles,
  Target,
  Zap,
  Heart,
  Code,
  Mail,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useSEO } from "../lib/useSEO";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

// Update with your real business stats!
const stats = [
  { label: "Launched", value: "2026", icon: Calendar },
  { label: "Active Users", value: "25", icon: Users },
  { label: "Annual Revenue", value: "$0", icon: DollarSign },
  { label: "Signups Last Month", value: "0", icon: TrendingUp },
  { label: "Solo Founder", value: "Yes", icon: User },
];

const principles = [
  {
    icon: Heart,
    title: "Creators First",
    description:
      "Every feature is designed to solve real creator problems. No dark patterns, no exploitation—just tools that genuinely help you grow.",
  },
  {
    icon: Target,
    title: "Radical Transparency",
    description:
      "Open metrics, honest communication, and real results. You deserve to know exactly what you're getting and how the platform performs.",
  },
  {
    icon: Users,
    title: "Authentic Collaboration",
    description:
      "Growth through genuine connections, not gaming algorithms. We believe in reciprocal support and community over competition.",
  },
  {
    icon: Code,
    title: "Built to Last",
    description:
      "Sustainable business model, no VC pressure, no pivot risk. Corippl exists to serve creators for the long haul, not chase exits.",
  },
];

const journey = [
  {
    phase: "The Problem",
    description:
      "Creators were stuck in a cycle: algorithms favored those already big, paid ads were expensive, and genuine collaboration was nearly impossible to coordinate. Small creators had no way to break through.",
  },
  {
    phase: "The Insight",
    description:
      "What if creators could grow together through structured collaboration? What if there was a platform that matched you with the right people at the right stage, with the right tools?",
  },
  {
    phase: "The Solution",
    description:
      "Corippl: Three interconnected tools (Pool, Collectives, Quick Connects) that meet creators wherever they are. Start small, grow strategically, get help when you need it.",
  },
  {
    phase: "The Mission",
    description:
      "Build a sustainable platform where creators grow through authentic collaboration, not paid advertising or algorithmic luck. Make creator success accessible to everyone.",
  },
];

const About = () => {
  useSEO({
    title: "About Us - Creator Collaboration Platform | Corippl",
    description:
      "Learn about Corippl, the three-tool suite helping creators grow through authentic collaboration. Built by a solo founder committed to transparency and creator success.",
    keywords:
      "creator collaboration platform, content promotion, newsletter growth, creator tools, authentic growth, solo founder, creator community",
    canonical: "https://www.corippl.com/about",
  });

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        {/* Dotted background overlay */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <Navbar />

          {/* Hero Section */}
          <section className="flex flex-col items-start justify-center flex-1 px-4 pt-28 pb-20 max-w-5xl mx-auto w-full animate-fadeInHero">
            <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 mb-6 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Built by Creators, for Creators</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
              Radical Transparency.
              <br />
              <span className="block text-gray-700">Real Creator Growth.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl animate-fadeSlideUp">
              Corippl is a solo founder project built on a simple belief:{" "}
              <strong>creators deserve better</strong>. No investors, no BS, no
              chasing exits. Just sustainable tools that help you grow through
              authentic collaboration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-bounceIn">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-full text-lg font-bold shadow-lg hover:bg-gray-800 transition-all transform hover:scale-105"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a
                href="mailto:Junior@corippl.com"
                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-black text-black rounded-full text-lg font-bold hover:bg-gray-50 transition-all"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email the Founder
              </a>
            </div>
          </section>

          {/* Journey Section */}
          <section className="relative px-4 py-20 bg-white animate-fadeInSection delay-200">
            <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-xl font-semibold text-gray-800 uppercase tracking-widest mb-3">
                  THE ORIGIN STORY
                </h2>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                  Why Corippl Exists
                </p>
              </div>

              <div className="space-y-8">
                {journey.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 hover:border-black transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {item.phase}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Principles Section */}
          <section className="relative px-4 py-20 bg-gray-50 animate-fadeInSection delay-300">
            <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-xl font-semibold text-gray-800 uppercase tracking-widest mb-3">
                  OUR PRINCIPLES
                </h2>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                  What We Stand For
                </p>
                <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-gray-600">
                  These aren't just words on a page. They guide every decision,
                  every feature, and every interaction.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {principles.map((principle, index) => {
                  const Icon = principle.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all"
                    >
                      <div className="bg-gray-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-black" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {principle.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {principle.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* The Three Tools Section */}
          <section className="relative px-4 py-20 bg-white animate-fadeInSection delay-400">
            <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-xl font-semibold text-gray-800 uppercase tracking-widest mb-3">
                  THE PRODUCT
                </h2>
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                  Three Tools, One Mission
                </p>
                <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-gray-600">
                  Corippl isn't just one tool—it's a complete growth suite that
                  meets you wherever you are.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Audience Pool */}
                <div className="bg-black text-white rounded-2xl p-8 border-2 border-gray-700">
                  <div className="bg-green-400 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Audience Pool</h3>
                  <p className="text-green-400 text-sm font-bold mb-4">
                    🌱 STARTING (0-100 followers)
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Content exchange network for finding your first 100 true
                    fans through smart matching and authentic engagement.
                  </p>
                </div>

                {/* Creator Collectives */}
                <div className="bg-white rounded-2xl p-8 border-2 border-orange-500">
                  <div className="bg-orange-400 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Collectives</h3>
                  <p className="text-orange-600 text-sm font-bold mb-4">
                    🤝 GROWING (50+ followers)
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    AI-matched groups with structured schedules and
                    accountability for consistent, reciprocal growth.
                  </p>
                </div>

                {/* Quick Connects */}
                <div className="bg-white rounded-2xl p-8 border-2 border-purple-500">
                  <div className="bg-purple-400 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Quick Connects</h3>
                  <p className="text-purple-600 text-sm font-bold mb-4">
                    🚀 ALL LEVELS
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Token-based marketplace for requesting help and offering
                    expertise whenever you need it.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Founder Section */}
          <section className="relative px-4 py-20 bg-gray-50 animate-fadeInSection delay-500">
            <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
              <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 uppercase tracking-widest mb-3">
                    FROM THE FOUNDER
                  </h2>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                    A Personal Commitment
                  </p>
                </div>

                <div className="prose prose-lg max-w-none">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
                    I built Corippl because I saw too many talented creators
                    struggling to break through—not because they lacked quality
                    content, but because they lacked access to the right
                    networks and tools.
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
                    As a solo founder, I answer every email, ship every feature,
                    and support every user myself. There's no corporate layer
                    between you and the person building this platform. When
                    something breaks, I fix it. When you have a feature request,
                    I hear it directly.
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
                    Corippl runs on a sustainable business model with no VC
                    pressure, no pivot risk, and no exit strategy. This platform
                    exists to serve creators for the long haul, and every
                    decision reflects that commitment.
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
                    If you have questions, ideas, or feedback, email me
                    directly. I read and respond to everything.
                  </p>
                </div>

                <div className="border-t-2 border-black pt-6 mt-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xl font-bold">JA</span>
                    </div>
                    <div>
                      <span className="block text-gray-900 font-bold text-lg">
                        Junior A
                      </span>
                      <span className="block text-sm text-gray-600 font-semibold mb-2">
                        Founder &amp; Solo Developer
                      </span>
                      <a
                        href="mailto:Junior@corippl.com"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Junior@corippl.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative px-4 py-20 bg-black animate-fadeInSection delay-600">
            <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4">
                Ready to Grow Through Authentic Collaboration?
              </h2>
              <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Join creators using Corippl's three-tool suite to build real
                audiences without paid ads or algorithmic luck.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-full text-lg font-bold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/promote"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full text-lg font-bold hover:bg-white hover:text-black transition-all"
                >
                  Learn More
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-400">
                No credit card required • Start in the Pool • Scale to
                Collectives
              </p>
            </div>
          </section>

          <Footer />
        </div>

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
          .animate-fadeInHero {
            animation: fadeInHero 0.9s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-fadeSlideUp {
            animation: fadeSlideUp 1s cubic-bezier(.4,0,.2,1) both;
          }
          .animate-fadeInSection {
            animation: fadeInSection 0.9s cubic-bezier(.4,0,.2,1) both;
          }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          .delay-500 { animation-delay: 0.5s; }
          .delay-600 { animation-delay: 0.6s; }
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.8);}
            60% { opacity: 1; transform: scale(1.08);}
            100% { opacity: 1; transform: scale(1);}
          }
          .animate-bounceIn {
            animation: bounceIn 0.7s cubic-bezier(.4,0,.2,1) both;
          }
        `}</style>
      </div>
    </>
  );
};

export default About;
