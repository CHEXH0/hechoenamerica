
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const ArtistHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-all duration-300 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20"
      >
        <ArrowLeft size={20} />
        Back to Artists
      </Link>
    </motion.div>
  );
};

export default ArtistHeader;
