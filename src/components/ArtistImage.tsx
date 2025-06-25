
import React from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import Waveform from "./Waveform";

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
        {/* Animated waveform background - more visible */}
        <div className="absolute inset-0 flex items-center justify-center transform rotate-6 group-hover:rotate-12 transition-transform duration-500 z-0">
          <div className="w-full h-full flex items-center justify-center opacity-60 scale-150">
            <Waveform />
          </div>
        </div>
        
        {/* Black overtone layer over the image */}
        <div className="absolute inset-0 bg-black/40 rounded-3xl z-10"></div>
        
        <img
          src={image}
          alt={name}
          className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500 z-20"
        />
        <div className="absolute -bottom-4 -right-4 bg-black/40 backdrop-blur-sm p-3 rounded-full z-30">
          <Music size={24} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default ArtistImage;
