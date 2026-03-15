import React from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ChamoyRequestCard from "@/components/ChamoyRequestCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const GomasChamoy = () => {
  const [searchParams] = useSearchParams();

  // Verify chamoy payment if redirected back from Stripe
  React.useEffect(() => {
    const chamoyPaidId = searchParams.get("chamoy_paid");
    if (chamoyPaidId) {
      supabase.functions.invoke("verify-chamoy-payment", { body: { request_id: chamoyPaidId } }).then(({ data }) => {
        if (data?.success) {
          toast({ title: "Payment confirmed!", description: "Your chamoy gummy order has been placed." });
        }
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/40 to-pink-950/30 relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 p-8">
        <Link
          to="/treats"
          className="inline-flex items-center text-pink-400 hover:text-pink-300 transition-colors duration-200 mb-8 group"
        >
          <motion.div whileHover={{ x: -5 }} transition={{ duration: 0.2 }}>
            <ArrowLeft className="h-5 w-5 mr-2" />
          </motion.div>
          Back to Treats
        </Link>

        <div className="text-center mb-12">
          <motion.h1
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Gomas Chamoy
          </motion.h1>
          <motion.p
            className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Handcrafted chamoy gummy candy, made to order with authentic Latin American flavors.
          </motion.p>
        </div>

        <div className="max-w-2xl mx-auto">
          <ChamoyRequestCard />
        </div>
      </div>

      <div className="relative z-10 mt-20">
        <Footer />
      </div>
    </div>
  );
};

export default GomasChamoy;
