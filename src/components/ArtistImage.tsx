
import React from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

interface ArtistImageProps {
  image: string;
  name: string;
}

const ArtistImage = ({ image, name }: ArtistImageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 rounded-3xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
        <img
          src={image}
          alt={name}
          className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute -bottom-4 -right-4 bg-white/20 backdrop-blur-sm p-3 rounded-full">
          <Music size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default ArtistImage;
