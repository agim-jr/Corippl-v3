import React, { useState } from "react";

const faqs = [
  {
    question: "What is Corippl?",
    answer: (
      <span>
        Corippl is a <b>creator collaboration platform</b> that helps you find
        your first 100 true fans through genuine connections. We offer three
        core features: <b>Audience Pool</b> for discovering aligned creators,{" "}
        <b>Creator Collectives</b> for structured reciprocal support groups, and{" "}
        <b>Quick Connects</b> for getting fast help when you need it.
        <br />
        <br />
        <span className="text-gray-500 text-sm">
          <b>Simple premise:</b> Quality over quantity. Build real relationships
          with creators who actually care about your work.
        </span>
      </span>
    ),
  },
  {
    question: "How does the platform work?",
    answer: (
      <span>
        <ul className="list-disc ml-5 space-y-2 mb-2">
          <li>
            <b>Audience Pool:</b> AI matches you with aligned creators at
            similar growth stages. Give and receive genuine feedback on content
            to build relationships.
          </li>
          <li>
            <b>Creator Collectives:</b> Join small groups (4-8 members) for
            structured reciprocal promotion with rotating schedules and
            reliability tracking.
          </li>
          <li>
            <b>Quick Connects:</b> Post requests for beta testers, feedback, or
            collaboration with token rewards. Get matched with helpers
            instantly.
          </li>
          <li>
            <b>Token System:</b> Earn tokens by helping others, spend them to
            get help. Build reputation through ratings and quality
            contributions.
          </li>
        </ul>
        <span className="text-gray-500 text-sm">
          The result: A thriving community where genuine collaboration leads to
          sustainable growth.
        </span>
      </span>
    ),
  },
  {
    question: "Who is Corippl for?",
    answer: (
      <span>
        Corippl is built for <b>early-stage content creators</b> (typically
        100-10,000 followers) who want to:
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Find their first 100 true fans through genuine connections</li>
          <li>Get honest feedback on their content from aligned creators</li>
          <li>
            Join structured support groups for consistent reciprocal promotion
          </li>
          <li>
            Access quick help for specific needs (beta testing, feedback, etc.)
          </li>
          <li>
            Build reputation and unlock better collaboration opportunities
          </li>
        </ul>
      </span>
    ),
  },
  {
    question: "How do I join?",
    answer: (
      <span>
        Simply click the <b>"Get Started"</b> button on our site and follow the
        steps to register. <br />
        <br />
        <span className="text-gray-500 text-sm">
          New users start with <b>100 free tokens</b> to explore all three
          features—Audience Pool, Collectives, and Quick Connects—before
          committing to a subscription.
        </span>
      </span>
    ),
  },
  {
    question: "How does the token system work?",
    answer: (
      <span>
        Tokens are Corippl's internal currency for reciprocal help:
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>
            <b>Earn tokens</b> by giving feedback in Audience Pool,
            participating in Collectives, or helping with Quick Connect requests
          </li>
          <li>
            <b>Spend tokens</b> to submit your content to Audience Pool or post
            Quick Connect requests
          </li>
          <li>
            <b>Token rewards</b> in Quick Connects incentivize quality help
            (beta testing, feedback, etc.)
          </li>
          <li>
            Build a <b>reputation score</b> through ratings to unlock better
            opportunities
          </li>
        </ul>
        <br />
        <span className="text-gray-500 text-sm">
          Tokens ensure everyone contributes and benefits equally—no free
          riders.
        </span>
      </span>
    ),
  },
  {
    question: "What makes Corippl different?",
    answer: (
      <span>
        Unlike typical social networks or paid promotion tools, Corippl focuses
        on <b>quality relationships over vanity metrics</b>. Our AI matching
        ensures you connect with creators who genuinely align with your content
        and growth stage.
        <br />
        <br />
        <span className="text-gray-500 text-sm">
          No buying followers or engagement. No algorithm gaming. Just real
          creators building genuine audiences through authentic collaboration.
        </span>
      </span>
    ),
  },
  {
    question: "Can I use just one feature, or do I need to use all three?",
    answer: (
      <span>
        You can use any combination of the three features based on your needs:
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>
            Use <b>Audience Pool</b> alone to discover aligned creators and get
            feedback
          </li>
          <li>
            Join <b>Collectives</b> for structured, consistent reciprocal
            support
          </li>
          <li>
            Post <b>Quick Connects</b> when you need specific help fast
          </li>
        </ul>
        <br />
        <span className="text-gray-500 text-sm">
          Most creators find the best results using all three together, but the
          choice is yours.
        </span>
      </span>
    ),
  },
];

const FaqSection = () => {
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

export default FaqSection;
