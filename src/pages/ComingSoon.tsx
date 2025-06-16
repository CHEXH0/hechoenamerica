
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-8">
          <Link 
            to="/" 
            className="flex items-center text-white hover:text-green-400 transition-colors absolute top-8 left-8"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <Clock className="h-12 w-12 text-green-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Coming Soon
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            We're working on something amazing for you. Our sample pack collection will be available soon!
          </p>
          
          <p className="text-lg text-gray-400 mb-12">
            Stay tuned for high-quality audio samples from HechoEnAmerica Studio.
          </p>
          
          <Link 
            to="/" 
            className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity font-medium"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
