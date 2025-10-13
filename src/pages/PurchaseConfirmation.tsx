import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PurchaseConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(10);
  const [emailSent, setEmailSent] = useState(false);
  const sessionId = searchParams.get('session_id');

  // Send confirmation email
  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (!user?.email || emailSent) return;

      try {
        await supabase.functions.invoke('send-contact-email', {
          body: {
            name: "Song Purchase",
            email: user.email,
            subject: "Song Generation Purchase Confirmed",
            message: `Thank you for your purchase!\n\nYour song generation request has been received and we'll get started on it right away.\n\nSession ID: ${sessionId || 'N/A'}\n\nWe'll send you updates to this email address.`
          }
        });
        setEmailSent(true);
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }
    };

    sendConfirmationEmail();
  }, [user, emailSent, sessionId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Purchase Successful!
          </h1>
          <p className="text-white/80 text-lg">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          {user?.email && (
            <p className="text-white/70 text-sm">
              A confirmation email has been sent to {user.email}
            </p>
          )}
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-white/70 text-sm">
            Redirecting to home in{" "}
            <span className="font-bold text-white text-lg">{countdown}</span>{" "}
            seconds...
          </p>
        </div>

        <Button
          onClick={handleGoHome}
          className="w-full bg-white text-purple-900 hover:bg-white/90 font-semibold"
          size="lg"
        >
          Go to Home Now
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-white/60 text-sm">
          Check your email for order details and download links.
        </p>
      </motion.div>
    </div>
  );
};

export default PurchaseConfirmation;
