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
        <p className="text-gray-400 mb-8">Last updated: March 6, 2026</p>
        
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
              <li>Custom chamoy gummy candy orders with shipping and delivery tracking</li>
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
            <h2 className="text-2xl font-semibold text-white mb-4">5. Chamoy Candy Orders</h2>
            <p className="mb-4">When ordering custom chamoy gummy candy:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must provide a valid name, email, phone number, and shipping address</li>
              <li>All orders require admin approval and custom pricing (typically 2-4 business days)</li>
              <li>You will receive a quoted price which you may accept or decline</li>
              <li>Payment is processed via Stripe after you accept the quoted price</li>
              <li>Order status and shipping updates are available on your dashboard</li>
              <li>Tracking numbers are provided once orders are shipped</li>
              <li>Shipping times are estimates and may vary</li>
              <li>Candy orders are non-refundable once shipped</li>
              <li>Your shipping information is stored securely and used only for order fulfillment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cancellations & Refunds</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Before production:</strong> Full refund available</li>
              <li><strong>During production:</strong> Requires admin review</li>
              <li>Refund amount depends on production progress</li>
              <li>Refunds go to the original payment method via Stripe</li>
              <li>Digital shop purchases are non-refundable once downloaded</li>
              <li>Chamoy candy orders are non-refundable once shipped</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Payments</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payment info must be accurate and authorized</li>
              <li>Payments are processed securely via Stripe</li>
              <li>Prices may change without notice</li>
              <li>Coupon codes may be applied at checkout</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. AI Songs</h2>
            <p>
              AI-generated music is based on your text and genre input. Quality may vary. Usage is subject to fair use limits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Intellectual Property</h2>
            <p>
              After full payment, you receive a license to use purchased content. We retain ownership of our branding and platform. Producer content rights transfer to you upon payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Delivery</h2>
            <p>
              Digital products are delivered via your dashboard, download links, or Google Drive. We only access what's needed for delivery. Physical products (chamoy candy) are shipped to the address provided at order time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Producer Applications</h2>
            <p>
              Producers may apply to join our platform. Acceptance is at our discretion. Approved producers are paid via Stripe Connect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Prohibited Uses</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Breaking any laws</li>
              <li>Infringing on others' rights</li>
              <li>Uploading harmful content</li>
              <li>Reselling content without permission</li>
              <li>Misusing AI generation</li>
              <li>Creating fake accounts</li>
              <li>Bypassing payment controls</li>
              <li>Providing false shipping or contact information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Liability</h2>
            <p>
              We are not liable for indirect damages from using our services, including delays, AI quality issues, or shipping delays for physical products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Changes</h2>
            <p>
              We may update these terms at any time. Continued use means you accept the changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact</h2>
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
