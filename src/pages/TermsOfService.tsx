import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
        
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: January 1, 2026</p>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Hecho En América's website and services, you accept and agree 
              to be bound by these Terms of Service. If you do not agree to these terms, please 
              do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Services Description</h2>
            <p>
              Hecho En América provides music production services including custom song creation, 
              mixing, mastering, and digital product sales. We connect artists with professional 
              producers to create high-quality music content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="mb-4">When you create an account with us, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Purchases and Payments</h2>
            <p className="mb-4">By making a purchase, you agree that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All payment information provided is accurate</li>
              <li>You are authorized to use the payment method</li>
              <li>Prices are subject to change without notice</li>
              <li>Custom song requests are non-refundable once work has begun</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p>
              Upon full payment, you receive a license to use purchased content for personal or 
              commercial purposes as specified at the time of purchase. We retain ownership of 
              our branding, website content, and proprietary production techniques.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Content Delivery</h2>
            <p>
              Digital products and custom songs will be delivered through your account dashboard 
              or via third-party services such as Google Drive. Delivery times for custom songs 
              vary based on complexity and are provided as estimates only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Prohibited Uses</h2>
            <p className="mb-4">You may not use our services to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Upload malicious content or attempt to harm our systems</li>
              <li>Resell or redistribute purchased content without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Hecho En América shall not be liable for 
              any indirect, incidental, special, consequential, or punitive damages arising from 
              your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes through our website or email. Continued use of our services 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us through our 
              website's contact form.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
