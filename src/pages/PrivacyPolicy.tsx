import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl overflow-hidden">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold heading-gradient mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 15, 2026</p>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              We at Hecho En America are committed to protecting your privacy. This policy explains how we handle your data when you use our music services and website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. What We Collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Name, email, and country from your account or contact form</li>
              <li>Profile info (display name, avatar, bio)</li>
              <li>Payment info (processed securely via Stripe)</li>
              <li>Song ideas, genres, and production preferences</li>
              <li>Revision feedback and chat messages</li>
              <li>AI generation inputs</li>
              <li>Producer application details</li>
              <li>Files you upload</li>
              <li>Google Drive data (only for file delivery)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use It</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and improve our services</li>
              <li>Match you with producers</li>
              <li>Process payments and refunds</li>
              <li>Generate AI music from your prompts</li>
              <li>Send order updates and notifications</li>
              <li>Respond to your messages</li>
              <li>Deliver files via Google Drive or download</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Stripe:</strong> Secure payments. We don't store card details.</li>
              <li><strong>Google Drive:</strong> File delivery only.</li>
              <li><strong>Supabase:</strong> Authentication and data storage.</li>
              <li><strong>Resend:</strong> Sending emails (confirmations, etc.).</li>
              <li><strong>Discord:</strong> Project notifications.</li>
            </ul>
            <p className="mt-4">
              We only access what's needed to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Account Security</h2>
            <p>
              We use email-based login with verification. Passwords are checked against known breaches. Sessions are managed securely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
            <p>
              We use appropriate measures to protect your data, including secure storage and access controls.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Translation</h2>
            <p>
              Translation is handled by your browser. No data is sent to us for this.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access or copy your data</li>
              <li>Request corrections</li>
              <li>Delete your account and all data</li>
              <li>Withdraw consent</li>
              <li>Disconnect third-party services</li>
              <li>Request project cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Account Deletion</h2>
            <p>
              You can delete your account from profile settings. This permanently removes all your data. This action cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
            <p>
              Questions? Use our contact form on the home page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;