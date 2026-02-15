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
        <p className="text-gray-400 mb-8">Last updated: February 15, 2026</p>
        
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
            <p className="mb-4">
              Hecho En América provides a music production platform that includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Custom song creation connecting artists with professional producers</li>
              <li>Professional recording, mixing, and mastering services (international travel and online)</li>
              <li>A digital marketplace ("Treats") for purchasing sample packs, presets, and music production tools</li>
              <li>AI-powered song generation</li>
              <li>A structured revision and collaboration workflow between clients and producers</li>
              <li>File delivery via Google Drive integration or direct download</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="mb-4">When you create an account with us, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete information including a valid email address</li>
              <li>Complete email verification before accessing account features</li>
              <li>Use a strong password (we check passwords against known breach databases for your security)</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
            <p className="mt-4">
              Your email address cannot be changed once verified. You may delete your account at any 
              time, which permanently removes all associated data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Custom Song Requests</h2>
            <p className="mb-4">When ordering a custom song, you agree to the following:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You will provide a clear song idea, genre preference, and any required production specifications at the time of order</li>
              <li>A producer will be assigned to your project based on genre and availability</li>
              <li>Producers must accept assignments within a designated timeframe; unaccepted projects will be reassigned</li>
              <li>Your order includes a specified number of revisions based on your selected tier</li>
              <li>You may provide feedback and request revisions through our revision chat system</li>
              <li>Delivery times are estimates and vary based on project complexity and producer workload</li>
              <li>Final delivery is contingent on all designated revisions being completed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cancellations & Refunds</h2>
            <p className="mb-4">Our cancellation and refund policy operates as follows:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Before production begins:</strong> Projects in "pending," "pending payment," or "paid" status may be cancelled for a full refund</li>
              <li><strong>During active production:</strong> Projects that have been accepted or are in progress require a cancellation request for admin review</li>
              <li>Refund amounts for in-progress projects are calculated based on production progress: 60% weighted on checklist completion and 40% on revision delivery</li>
              <li>All refunds are processed through Stripe to the original payment method</li>
              <li>Digital marketplace purchases ("Treats") are non-refundable once downloaded</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Purchases and Payments</h2>
            <p className="mb-4">By making a purchase, you agree that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All payment information provided is accurate and you are authorized to use the payment method</li>
              <li>Payments are processed securely through Stripe — we never store your full card details</li>
              <li>Prices are displayed in the applicable currency and are subject to change without notice</li>
              <li>Valid coupon codes may be applied at checkout for eligible discounts</li>
              <li>Producer payouts are handled via Stripe Connect and are subject to platform fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. AI Song Generation</h2>
            <p>
              Our AI song generation feature creates music based on your text prompts and genre selections. 
              AI-generated content is provided as-is and may vary in quality. We do not guarantee that 
              AI-generated songs will meet specific creative expectations. Usage of the AI generation 
              feature is subject to fair use limits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p>
              Upon full payment, you receive a license to use purchased content (custom songs, sample packs, 
              presets, and other digital products) for personal or commercial purposes as specified at the 
              time of purchase. We retain ownership of our branding, website content, platform design, and 
              proprietary production techniques. Producer-created content rights are transferred to the 
              client upon full payment and project completion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Content Delivery</h2>
            <p>
              Digital products and custom songs are delivered through your account dashboard, direct download 
              links, or via Google Drive integration. When using Google Drive delivery, you must authorize 
              our application to upload files to your Drive. We only access the permissions strictly necessary 
              for file delivery and do not read, modify, or delete any other files in your Google account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Producer Applications</h2>
            <p>
              Producers may apply to join our platform through the producer application process. Acceptance 
              is at our sole discretion. Approved producers are onboarded via Stripe Connect for payment 
              processing and must maintain professional standards of communication and delivery quality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Prohibited Uses</h2>
            <p className="mb-4">You may not use our services to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Upload malicious content or attempt to harm our systems</li>
              <li>Resell or redistribute purchased content without authorization</li>
              <li>Misuse the AI song generation feature for harmful or illegal content</li>
              <li>Create fraudulent accounts or impersonate other users</li>
              <li>Attempt to circumvent payment or access controls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Hecho En América shall not be liable for 
              any indirect, incidental, special, consequential, or punitive damages arising from 
              your use of our services, including but not limited to delays in production delivery, 
              AI-generated content quality, or third-party service availability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes through our website or email. Continued use of our services 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us through our 
              website's contact form on the home page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
