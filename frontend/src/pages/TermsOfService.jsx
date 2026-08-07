import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useSEO } from "../lib/useSEO";

const TermsOfService = () => {
  // Add SEO
  useSEO({
    title: "Terms of Service - User Agreement | Corippl",
    description:
      "Review Corippl's terms of service for our content promotion platform. Understand the rules and guidelines for newsletter promotion, content sharing, and creator collaboration.",
    keywords:
      "terms of service, user agreement, content promotion terms, newsletter platform rules, creator platform legal, service agreement",
    canonical: "https://www.corippl.com/terms",
  });

  return (
    <div className="min-h-screen bg-gray-50 font-mono">
      {/* Header with Logo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Logo />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-black hover:bg-black hover:text-white px-3 py-1 rounded font-bold mb-6 transition border border-black"
        >
          ← Back to Home
        </Link>

        <div className="bg-white border border-black rounded-2xl shadow-2xl p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">Last Updated: December 20, 2025</p>

          <div className="space-y-6 text-black">
            <section>
              <h2 className="text-2xl font-bold mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding
                agreement between you and Shadow AOI LLC ("Corippl," "we,"
                "our," or "us") regarding your use of the Corippl.com platform
                (the "Platform"). By accessing or using the Platform, you agree
                to be bound by these Terms and our Privacy Policy. If you do not
                agree to these Terms, you may not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                2. Description of Service
              </h2>
              <p>
                Corippl is a content cross-promotion platform that connects
                content creators to help them share and promote each other's
                content. The Platform uses AI-powered matching algorithms to
                pair users based on their content preferences, niches, and
                interests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Eligibility</h2>
              <p className="mb-2">To use the Platform, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 13 years of age</li>
                <li>
                  Have the legal capacity to enter into a binding contract
                </li>
                <li>
                  Not be prohibited from using the Platform under applicable
                  laws
                </li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                4. Account Registration and Security
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.1 Account Creation
              </h3>
              <p>
                You may create an account using your email address or by signing
                in through Google. You are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities that occur under your account.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.2 Account Security
              </h3>
              <p>
                You agree to immediately notify us of any unauthorized use of
                your account or any other breach of security. We are not liable
                for any loss or damage arising from your failure to protect your
                account credentials.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.3 Account Accuracy
              </h3>
              <p>
                You agree to provide accurate, current, and complete information
                during registration and to update such information to keep it
                accurate, current, and complete.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. User Content</h2>

              <h3 className="text-xl font-bold mb-2 mt-4">5.1 Your Content</h3>
              <p>
                You retain all ownership rights in the content you submit to the
                Platform ("User Content"). By submitting User Content, you grant
                Corippl a worldwide, non-exclusive, royalty-free license to use,
                reproduce, distribute, and display your User Content solely for
                the purpose of operating and promoting the Platform.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                5.2 Content Standards
              </h3>
              <p className="mb-2">You agree that your User Content will not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Infringe any intellectual property rights, privacy rights, or
                  other rights of any third party
                </li>
                <li>
                  Contain harmful, threatening, abusive, harassing, defamatory,
                  vulgar, obscene, or otherwise objectionable material
                </li>
                <li>Contain malware, viruses, or other harmful code</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Promote illegal activities or violence</li>
                <li>
                  Contain spam, advertisements, or promotional material (except
                  as part of legitimate content sharing)
                </li>
                <li>
                  Impersonate any person or entity or misrepresent your
                  affiliation with any person or entity
                </li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">
                5.3 Content Moderation
              </h3>
              <p>
                We reserve the right, but have no obligation, to monitor,
                review, or remove User Content that violates these Terms or is
                otherwise objectionable. We may also suspend or terminate
                accounts that repeatedly violate these Terms.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                5.4 Content Flagging
              </h3>
              <p>
                Users may flag content they believe violates these Terms. We
                will review flagged content and take appropriate action, which
                may include removing the content or suspending the user's
                account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Prohibited Uses</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Use the Platform for any illegal purpose or in violation of
                  any laws
                </li>
                <li>
                  Attempt to gain unauthorized access to the Platform or other
                  users' accounts
                </li>
                <li>
                  Interfere with or disrupt the Platform or servers or networks
                  connected to the Platform
                </li>
                <li>
                  Use automated means (such as bots or scrapers) to access the
                  Platform
                </li>
                <li>
                  Collect or harvest any personally identifiable information
                  from other users
                </li>
                <li>
                  Reverse engineer, decompile, or disassemble any part of the
                  Platform
                </li>
                <li>
                  Remove, circumvent, disable, damage, or otherwise interfere
                  with security-related features of the Platform
                </li>
                <li>
                  Engage in any activity that could damage, disable, overburden,
                  or impair the Platform
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                7. Subscription Plans and Payments
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                7.1 Free and Premium Plans
              </h3>
              <p>
                Corippl offers both free and premium subscription plans. Premium
                plans provide additional features such as unlimited content
                shuffles, advanced analytics, and priority matching.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">7.2 Payment Terms</h3>
              <p>
                Premium subscriptions are billed on a recurring basis (monthly
                or annually). You authorize us to charge your payment method for
                the subscription fee and any applicable taxes. All payments are
                processed through Stripe.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                7.3 Cancellation and Refunds
              </h3>
              <p>
                You may cancel your premium subscription at any time.
                Cancellations will take effect at the end of the current billing
                period. We do not offer refunds for partial subscription
                periods, except as required by law.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">7.4 Price Changes</h3>
              <p>
                We reserve the right to change our subscription prices at any
                time. We will provide you with at least 30 days' notice of any
                price changes. If you do not agree to the price change, you may
                cancel your subscription.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                8. Intellectual Property Rights
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                8.1 Platform Ownership
              </h3>
              <p>
                The Platform and its original content, features, and
                functionality are owned by Shadow AOI LLC and are protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">8.2 Trademarks</h3>
              <p>
                "Corippl" and our logo are trademarks of Shadow AOI LLC. You may
                not use our trademarks without our prior written permission.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                8.3 Copyright Infringement
              </h3>
              <p>
                We respect the intellectual property rights of others. If you
                believe that your copyrighted work has been copied in a way that
                constitutes copyright infringement, please contact us at
                Junior@corippl.com with the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>
                  A description of the copyrighted work that you claim has been
                  infringed
                </li>
                <li>
                  A description of where the infringing material is located on
                  the Platform
                </li>
                <li>Your contact information</li>
                <li>
                  A statement that you have a good faith belief that the use is
                  not authorized
                </li>
                <li>
                  A statement, under penalty of perjury, that the information
                  you provided is accurate
                </li>
                <li>Your physical or electronic signature</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                9. Privacy and Data Protection
              </h2>
              <p>
                Your use of the Platform is also governed by our Privacy Policy,
                which is incorporated into these Terms by reference. Please
                review our{" "}
                <Link
                  to="/privacy"
                  className="text-black underline hover:bg-black hover:text-white px-1 rounded transition font-bold"
                >
                  Privacy Policy
                </Link>{" "}
                to understand how we collect, use, and protect your personal
                information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                10. Third-Party Services
              </h2>
              <p>
                The Platform may contain links to third-party websites or
                services that are not owned or controlled by Corippl. We have no
                control over and assume no responsibility for the content,
                privacy policies, or practices of any third-party websites or
                services. You acknowledge and agree that we are not responsible
                or liable for any damage or loss caused by or in connection with
                the use of any such third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                11. Disclaimers and Limitation of Liability
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                11.1 No Warranties
              </h3>
              <p>
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT
                NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
                FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT
                THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF
                VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                11.2 Limitation of Liability
              </h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SHADOW
                AOI LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
                DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH
                YOUR USE OF THE PLATFORM.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                11.3 Maximum Liability
              </h3>
              <p>
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR
                RELATING TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE
                AMOUNT YOU PAID US IN THE 12 MONTHS PRIOR TO THE EVENT GIVING
                RISE TO THE LIABILITY, OR $100, WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Shadow AOI LLC
                and its officers, directors, employees, and agents from and
                against any claims, liabilities, damages, losses, and expenses,
                including reasonable attorneys' fees, arising out of or in any
                way connected with your access to or use of the Platform, your
                User Content, or your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">13. Termination</h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                13.1 Termination by You
              </h3>
              <p>
                You may terminate your account at any time by deleting your
                account through your account settings or by contacting us at
                Junior@corippl.com.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                13.2 Termination by Us
              </h3>
              <p>
                We may suspend or terminate your account and access to the
                Platform at any time, with or without cause, with or without
                notice. We may also remove or disable any User Content at any
                time.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                13.3 Effect of Termination
              </h3>
              <p>
                Upon termination, your right to use the Platform will
                immediately cease. All provisions of these Terms that by their
                nature should survive termination shall survive, including
                ownership provisions, warranty disclaimers, indemnification, and
                limitations of liability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                14. Dispute Resolution and Arbitration
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                14.1 Informal Resolution
              </h3>
              <p>
                Before filing a claim, you agree to try to resolve the dispute
                informally by contacting us at Junior@corippl.com. We will try
                to resolve the dispute informally by contacting you via email.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                14.2 Binding Arbitration
              </h3>
              <p>
                If we cannot resolve the dispute informally, any dispute arising
                out of or relating to these Terms or the Platform will be
                resolved through binding arbitration in accordance with the
                American Arbitration Association's rules. The arbitration will
                be conducted in Maryland, USA.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                14.3 Class Action Waiver
              </h3>
              <p>
                YOU AGREE THAT ANY ARBITRATION OR PROCEEDING SHALL BE LIMITED TO
                THE DISPUTE BETWEEN YOU AND US INDIVIDUALLY. YOU WAIVE ANY RIGHT
                TO PARTICIPATE IN A CLASS ACTION OR CLASS-WIDE ARBITRATION.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">15. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Maryland, United States, without
                regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">16. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will
                notify you of any material changes by posting the new Terms on
                this page and updating the "Last Updated" date. Your continued
                use of the Platform after any changes indicates your acceptance
                of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">17. Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid or
                unenforceable, the remaining provisions will remain in full
                force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">18. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and Shadow AOI LLC regarding the
                use of the Platform and supersede all prior agreements and
                understandings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                19. Contact Information
              </h2>
              <p className="mb-2">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mt-3">
                <p className="font-bold">Shadow AOI LLC</p>
                <p>100 West Road Suite 300</p>
                <p>Towson, MD 21204</p>
                <p className="mt-2">
                  <strong>Email:</strong> Junior@corippl.com
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  <Link
                    to="/"
                    className="text-black underline hover:bg-black hover:text-white px-1 rounded transition"
                  >
                    https://corippl.com
                  </Link>
                </p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded-xl">
              <p className="text-sm text-gray-700">
                <strong>
                  By using Corippl, you acknowledge that you have read,
                  understood, and agree to be bound by these Terms of Service
                  and our{" "}
                  <Link
                    to="/privacy"
                    className="text-black underline hover:bg-black hover:text-white px-1 rounded transition"
                  >
                    Privacy Policy
                  </Link>
                  .
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>© 2025 Shadow AOI LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
