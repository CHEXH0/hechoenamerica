import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-20 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[9998] rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl p-5"
        >
          <button
            onClick={decline}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <Cookie className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <p className="text-sm text-gray-300 leading-relaxed pr-4">
                We use essential cookies for authentication and site functionality. No tracking cookies are used. By continuing, you agree to our{" "}
                <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  Privacy Policy
                </Link>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={accept}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={decline}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
