import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
        
        <h1 className="text-4xl font-bold heading-gradient mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: February 15, 2026</p>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance</h2>
            <p>
              By using our website and services, you agree to these Terms. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Services</h2>
            <p className="mb-4">Hecho En America offers:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Custom songs connecting artists with producers</li>
              <li>Recording, mixing, and mastering</li>
              <li>A digital shop ("Treats") for samples, presets, and tools</li>
              <li>AI song generation</li>
              <li>Revision and collaboration tools</li>
              <li>File delivery via Google Drive or direct download</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Accounts</h2>
            <p className="mb-4">When creating an account, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate info and a valid email</li>
              <li>Verify your email before accessing features</li>
              <li>Use a strong password</li>
              <li>Keep your credentials secure</li>
              <li>Accept responsibility for all account activity</li>
              <li>Report unauthorized use immediately</li>
            </ul>
            <p className="mt-4">
              Your email cannot be changed once verified. You may delete your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Custom Songs</h2>
            <p className="mb-4">When ordering a custom song:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide a clear idea, genre, and production needs</li>
              <li>A producer will be assigned based on genre and availability</li>
              <li>Unaccepted projects will be reassigned</li>
              <li>Revisions are included based on your tier</li>
              <li>Feedback is given through our revision chat</li>
              <li>Delivery times are estimates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cancellations & Refunds</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Before production:</strong> Full refund available</li>
              <li><strong>During production:</strong> Requires admin review</li>
              <li>Refund amount depends on production progress</li>
              <li>Refunds go to the original payment method via Stripe</li>
              <li>Digital shop purchases are non-refundable once downloaded</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Payments</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payment info must be accurate and authorized</li>
              <li>Payments are processed securely via Stripe</li>
              <li>Prices may change without notice</li>
              <li>Coupon codes may be applied at checkout</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. AI Songs</h2>
            <p>
              AI-generated music is based on your text and genre input. Quality may vary. Usage is subject to fair use limits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p>
              After full payment, you receive a license to use purchased content. We retain ownership of our branding and platform. Producer content rights transfer to you upon payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Delivery</h2>
            <p>
              Products are delivered via your dashboard, download links, or Google Drive. We only access what's needed for delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Producer Applications</h2>
            <p>
              Producers may apply to join our platform. Acceptance is at our discretion. Approved producers are paid via Stripe Connect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Prohibited Uses</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Breaking any laws</li>
              <li>Infringing on others' rights</li>
              <li>Uploading harmful content</li>
              <li>Reselling content without permission</li>
              <li>Misusing AI generation</li>
              <li>Creating fake accounts</li>
              <li>Bypassing payment controls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Liability</h2>
            <p>
              We are not liable for indirect damages from using our services, including delays or AI quality issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes</h2>
            <p>
              We may update these terms at any time. Continued use means you accept the changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact</h2>
            <p>
              Questions? Use our contact form on the home page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;