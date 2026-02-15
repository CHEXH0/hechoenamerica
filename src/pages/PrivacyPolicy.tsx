import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 15, 2026</p>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to Hecho En América ("we," "our," or "us"). We are committed to protecting your 
              personal information and your right to privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website and use our music 
              production services, digital marketplace, and AI song generation tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Name, email address, and country when you create an account or submit a contact form</li>
              <li>Profile information such as display name, avatar, and bio</li>
              <li>Payment information when you purchase custom songs, digital products, or treats from our marketplace (processed securely via Stripe)</li>
              <li>Song ideas, creative briefs, genre preferences, and production requirements when you request custom music</li>
              <li>Revision feedback, chat messages, and meeting requests during the production process</li>
              <li>AI song generation prompts and genre selections</li>
              <li>Producer application details including portfolio links and experience</li>
              <li>Files and content you upload through our services</li>
              <li>Information from third-party services (such as Google Drive) when you connect them for file delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our music production and marketplace services</li>
              <li>Process custom song requests and match you with appropriate producers</li>
              <li>Manage the revision and delivery workflow for your projects</li>
              <li>Process payments, refunds, and producer payouts through Stripe</li>
              <li>Generate AI-assisted music based on your prompts</li>
              <li>Send transactional emails including order confirmations, delivery notifications, revision updates, and producer assignment notices</li>
              <li>Send Discord notifications related to project status and platform activity</li>
              <li>Respond to your contact form inquiries and support requests</li>
              <li>Evaluate producer applications and manage the producer onboarding process</li>
              <li>Deliver purchased files via Google Drive integration or direct download</li>
              <li>Maintain platform analytics and payment reporting for administrative purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p className="mb-4">We integrate with the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Stripe:</strong> For secure payment processing, subscription management, and producer payouts via Stripe Connect. We do not store your full payment card details.</li>
              <li><strong>Google Drive:</strong> To deliver purchased content and production files. When you connect your Google account, we only access permissions necessary to upload files to your Drive.</li>
              <li><strong>Supabase:</strong> For authentication, data storage, and file hosting.</li>
              <li><strong>Resend:</strong> For sending transactional emails (order confirmations, delivery notifications, etc.).</li>
              <li><strong>Discord:</strong> For internal project notifications and community engagement.</li>
            </ul>
            <p className="mt-4">
              We do not access, read, or modify any data in your connected third-party accounts beyond 
              what is strictly necessary to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Authentication & Account Security</h2>
            <p>
              We use email-based authentication with mandatory email verification. Passwords are checked 
              against known breach databases (HIBP) to ensure account security. Email addresses are immutable 
              once verified. We support secure password recovery via email. Your authentication sessions are 
              managed securely, and our sign-out process clears local state regardless of server response.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Storage & Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. Your data 
              is stored securely using Supabase with row-level security policies. Files are stored in 
              secure cloud storage buckets with access controls.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Translation & Localization</h2>
            <p>
              Our website supports multiple languages through your browser's built-in translation feature. 
              No personal data is sent to us for translation purposes — all translation is handled locally 
              by your browser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and all associated data (including contact submissions, purchases, song requests, AI generations, profile data, and stored files)</li>
              <li>Withdraw consent at any time</li>
              <li>Disconnect third-party services (such as Google Drive) from your account</li>
              <li>Request cancellation and refund of ongoing projects subject to our refund policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Account Deletion</h2>
            <p>
              You may delete your account at any time from your profile settings. Account deletion requires 
              typing "DELETE" to confirm. This permanently removes all your data across our systems including 
              profile information, purchase history, song requests, AI generations, contact submissions, and 
              stored files. This action is irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through 
              our website's contact form on the home page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
