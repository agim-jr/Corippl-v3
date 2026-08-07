import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useSEO } from "../lib/useSEO";

const PrivacyPolicy = () => {
  // ✅ Add SEO hook at the top of the component
  useSEO({
    title: "Privacy Policy - Your Data Protection | Corippl",
    description:
      "Read Corippl's privacy policy to understand how we protect your data on our content promotion platform. Learn about data collection, usage, and your privacy rights.",
    keywords:
      "privacy policy, data protection, content platform privacy, newsletter promotion privacy, user data security, GDPR compliance",
    canonical: "https://www.corippl.com/privacy",
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">Last Updated: December 20, 2025</p>

          <div className="space-y-6 text-black">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
              <p className="mb-3">
                Shadow AOI LLC ("we," "our," or "us") operates Corippl.com (the
                "Platform"). This Privacy Policy explains how we collect, use,
                disclose, and protect your personal information when you use our
                content cross-promotion platform.
              </p>
              <p>
                By using Corippl, you agree to the collection and use of
                information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                2. Information We Collect
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                2.1 Information You Provide Directly
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Account Information:</strong> Email address, username,
                  and password
                </li>
                <li>
                  <strong>Profile Information:</strong> Content preferences,
                  interest categories, and niche selections
                </li>
                <li>
                  <strong>Content Submissions:</strong> URLs, descriptions,
                  categories, and metadata of content you submit for promotion
                </li>
                <li>
                  <strong>Payment Information:</strong> Processed securely
                  through Stripe (we do not store your full credit card details)
                </li>
                <li>
                  <strong>Communications:</strong> Messages you send to us and
                  feedback you provide
                </li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">
                2.2 Information Collected Automatically
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Usage Data:</strong> Information about how you
                  interact with the Platform, including content you share,
                  performance metrics, and sharing activity
                </li>
                <li>
                  <strong>Analytics Data:</strong> We use Google Analytics to
                  collect information about your device, browser type, IP
                  address, pages visited, time spent on pages, and referring
                  websites
                </li>
                <li>
                  <strong>Cookies and Tracking Technologies:</strong> We use
                  cookies and similar technologies to track activity on our
                  Platform and store certain information
                </li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">
                2.3 Information from Third Parties
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Google Login:</strong> If you sign in using Google, we
                  receive your name, email address, and profile picture from
                  Google according to your Google account settings
                </li>
                <li>
                  <strong>Payment Processors:</strong> We receive transaction
                  confirmations from Stripe but do not store your complete
                  payment card information
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                3. How We Use Your Information
              </h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve the Platform</li>
                <li>Create and manage your account</li>
                <li>
                  Match you with relevant content creators based on your
                  interests and preferences
                </li>
                <li>Facilitate content cross-promotion between users</li>
                <li>Process payments and manage subscriptions</li>
                <li>
                  Send you service-related communications, including security
                  alerts and account notifications
                </li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>
                  Analyze Platform usage and performance to improve our services
                </li>
                <li>
                  Detect, prevent, and address fraud, security issues, and
                  technical problems
                </li>
                <li>
                  Comply with legal obligations and enforce our Terms of Service
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                4. How We Share Your Information
              </h2>
              <p className="mb-2">
                We may share your information in the following circumstances:
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.1 With Other Users
              </h3>
              <p className="mb-2">
                When you use the Platform to cross-promote content, certain
                information is shared with other users, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your username and profile information</li>
                <li>
                  Content you submit for promotion (URLs, descriptions,
                  categories)
                </li>
                <li>Performance metrics related to content you share</li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.2 With Service Providers
              </h3>
              <p className="mb-2">
                We share information with third-party service providers who
                perform services on our behalf:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Payment Processing:</strong> Stripe (for payment
                  processing)
                </li>
                <li>
                  <strong>Analytics:</strong> Google Analytics (for usage
                  analytics)
                </li>
                <li>
                  <strong>Email Services:</strong> Email service providers for
                  transactional emails
                </li>
                <li>
                  <strong>Cloud Infrastructure:</strong> AWS or similar cloud
                  service providers for hosting and storage
                </li>
              </ul>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.3 For Legal Reasons
              </h3>
              <p>
                We may disclose your information if required by law or in
                response to valid legal processes, or to protect the rights,
                property, or safety of Corippl, our users, or others.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                4.4 Business Transfers
              </h3>
              <p>
                If we are involved in a merger, acquisition, or sale of assets,
                your information may be transferred as part of that transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to
                provide you with our services and as described in this Privacy
                Policy. We will retain and use your information to comply with
                our legal obligations, resolve disputes, and enforce our
                agreements.
              </p>
              <p className="mt-2">
                When you delete your account, we will delete or anonymize your
                personal information within 30 days, except where we are
                required to retain it for legal, regulatory, or security
                purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                6. Your Rights and Choices
              </h2>

              <h3 className="text-xl font-bold mb-2 mt-4">
                6.1 Access and Update
              </h3>
              <p>
                You can access and update your account information at any time
                through your account settings.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                6.2 Delete Your Account
              </h3>
              <p>
                You can delete your account at any time through your account
                settings or by contacting us at support@corippl.com.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                6.3 Marketing Communications
              </h3>
              <p>
                You can opt out of promotional emails by following the
                unsubscribe link in those emails. You cannot opt out of
                service-related communications.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">6.4 Cookies</h3>
              <p>
                Most web browsers are set to accept cookies by default. You can
                usually choose to set your browser to remove or reject cookies,
                but this may affect the functionality of the Platform.
              </p>

              <h3 className="text-xl font-bold mb-2 mt-4">
                6.5 Your Privacy Rights (US Residents)
              </h3>
              <p className="mb-2">
                Depending on your state of residence, you may have the following
                rights:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Right to know what personal information we collect and how we
                  use it
                </li>
                <li>Right to request deletion of your personal information</li>
                <li>Right to correct inaccurate personal information</li>
                <li>
                  Right to opt out of the sale or sharing of your personal
                  information (we do not sell your information)
                </li>
                <li>
                  Right to non-discrimination for exercising your privacy rights
                </li>
              </ul>
              <p className="mt-2">
                To exercise these rights, please contact us at
                support@corippl.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Security</h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction. However, no
                method of transmission over the Internet or electronic storage
                is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Children's Privacy</h2>
              <p>
                Our Platform is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us,
                and we will delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                9. International Data Transfers
              </h2>
              <p>
                Your information may be transferred to and processed in
                countries other than your country of residence. These countries
                may have data protection laws that are different from the laws
                of your country. We take appropriate measures to ensure that
                your personal information remains protected in accordance with
                this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                10. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the "Last Updated" date. Your
                continued use of the Platform after any changes indicates your
                acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Contact Us</h2>
              <p className="mb-2">
                If you have questions, concerns, or requests regarding this
                Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mt-3">
                <p className="font-bold">Shadow AOI LLC</p>
                <p>100 West Road Suite 300</p>
                <p>Towson, MD 21204</p>
                <p className="mt-2">
                  <strong>Email:</strong> support@corippl.com
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
                  By using Corippl, you acknowledge that you have read and
                  understood this Privacy Policy.
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

export default PrivacyPolicy;
