import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProducerApplicationForm from "@/components/ProducerApplicationForm";
import { useHiringStatus } from "@/hooks/useHiringStatus";

const ProducerApplication = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { data: hiringStatus} = useHiringStatus();
  
  const isHiring = hiringStatus?.enabled ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-pink-950 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-4xl"
      >
        {/* Back Button */}
        <Link to="/treats">
          <Button
            variant="ghost"
            className="mb-8 text-white hover:text-pink-300 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Treats
          </Button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Join Our Producer Network
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Become part of Hecho En América's talented team of music producers
          </p>
        </motion.div>

        {isHiring ? (
          <ProducerApplicationForm />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-red-900/50 border-purple-500/40 backdrop-blur-md">
              <CardContent className="py-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="mb-6"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                    <UserX className="h-12 w-12 text-purple-400" />
                  </div>
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Not Currently Hiring
                </h2>
                <p className="text-gray-300 text-lg max-w-md mx-auto mb-8">
                  We're not accepting producer applications at the moment. Please check back later or follow us on social media for updates!
                </p>
                
                <Link to="/">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white"
                  >
                    Return Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProducerApplication;
