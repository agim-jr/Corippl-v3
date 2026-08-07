import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  MessageSquare,
  Clock,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeedbackForm from "../components/FeedbackForm";
import { useSEO } from "../lib/useSEO";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const ContactPage = () => {
  // ✅ Add useSEO hook at the top of the component
  useSEO({
    title: "Contact Us - Get Help with Content Promotion | Corippl",
    description:
      "Have questions about content or newsletter promotion? Contact Corippl's support team for help with cross-promotion, partnerships, and platform features.",
    keywords:
      "contact content promotion, newsletter promotion support, creator platform help, cross-promotion assistance, content promotion contact",
    canonical: "https://www.corippl.com/contact",
  });

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Background pattern matching Landing page */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col flex-1">
          <Navbar />

          {/* Main Content */}
          <main className="flex-1 px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
            <div className="max-w-7xl mx-auto">
              {/* Page Title */}
              <div className="mb-12 sm:mb-16 text-center animate-fadeInHero">
                <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 mb-6 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  <span>We're Here to Help</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                  Get in Touch
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
                  Questions about Pool, Collectives, or Quick Connects? Need
                  help getting started? Reach out directly—I read and respond to
                  everything.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                {/* Left Column - Info */}
                <div className="space-y-6 animate-fadeSlideUp">
                  {/* Direct Email Card */}
                  <div className="bg-black text-white border-2 border-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-white rounded-xl flex-shrink-0">
                        <Mail className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg sm:text-xl mb-2">
                          Email the Founder
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                          Direct line to Junior—no support tickets, no bots,
                          just real conversations.
                        </p>
                      </div>
                    </div>
                    <a
                      href="mailto:junior@corippl.com"
                      className="block bg-white text-black px-6 py-4 rounded-xl font-bold text-center hover:bg-gray-100 transition-all text-base sm:text-lg"
                    >
                      junior@corippl.com
                    </a>
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Response within 24-48 hours</span>
                    </div>
                  </div>

                  {/* What I Can Help With */}
                  <div className="bg-white border-2 border-black rounded-2xl shadow-lg p-6 sm:p-8">
                    <h3 className="font-bold text-black text-lg sm:text-xl mb-6">
                      What I Can Help With
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            Getting Started
                          </p>
                          <p className="text-gray-600 text-sm">
                            Pool setup, profile optimization, first steps
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            Feature Questions
                          </p>
                          <p className="text-gray-600 text-sm">
                            How Collectives work, Quick Connects, matching
                            algorithm
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            Growth Strategy
                          </p>
                          <p className="text-gray-600 text-sm">
                            Best practices, collaboration tips, scaling advice
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            Technical Support
                          </p>
                          <p className="text-gray-600 text-sm">
                            Bug reports, account issues, payment questions
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">
                            Feature Requests
                          </p>
                          <p className="text-gray-600 text-sm">
                            Ideas, suggestions, feedback on the platform
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Quick Links Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8">
                    <h3 className="font-bold text-black text-lg sm:text-xl mb-6">
                      Quick Resources
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          to="/promote"
                          className="flex items-center gap-3 text-black font-bold hover:bg-black hover:text-white px-4 py-3 rounded-xl transition-all group"
                        >
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                          <span>How Corippl Works</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/pricing"
                          className="flex items-center gap-3 text-black font-bold hover:bg-black hover:text-white px-4 py-3 rounded-xl transition-all group"
                        >
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                          <span>View Pricing Plans</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/about"
                          className="flex items-center gap-3 text-black font-bold hover:bg-black hover:text-white px-4 py-3 rounded-xl transition-all group"
                        >
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                          <span>About the Founder</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/signup"
                          className="flex items-center gap-3 text-white bg-black font-bold hover:bg-gray-800 px-4 py-3 rounded-xl transition-all group"
                        >
                          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform flex-shrink-0" />
                          <span>Get Started Free</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Column - Form */}
                <div className="animate-fadeSlideUp delay-200">
                  <div className="bg-white border-2 border-black rounded-2xl shadow-lg p-6 sm:p-8 lg:sticky lg:top-24">
                    <div className="mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Send a Message
                      </h2>
                      <p className="text-gray-600 text-sm sm:text-base">
                        Fill out the form below and I'll get back to you as soon
                        as possible.
                      </p>
                    </div>
                    <FeedbackForm standalone={true} />
                  </div>
                </div>
              </div>

              {/* Bottom CTA Section */}
              <div className="mt-16 sm:mt-20 text-center animate-fadeInSection delay-400">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 sm:p-12 max-w-3xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Prefer to Explore First?
                  </h2>
                  <p className="text-gray-600 mb-6 text-base sm:text-lg">
                    Check out how Corippl works or dive right into the Pool to
                    start growing your audience today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/promote"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-black text-black rounded-full text-base font-bold hover:bg-black hover:text-white transition-all"
                    >
                      Learn How It Works
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-full text-base font-bold hover:bg-gray-800 transition-all"
                    >
                      Start for Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>

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
          .delay-200 {
            animation-delay: 0.2s;
          }
          .delay-400 {
            animation-delay: 0.4s;
          }
        `}</style>
      </div>
    </>
  );
};

export default ContactPage;
