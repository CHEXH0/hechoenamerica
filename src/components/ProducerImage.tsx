import React from "react";
import { motion } from "framer-motion";

interface ProducerImageProps {
  image: string;
  name: string;
  emoji?: string;
}

const ProducerImage = ({ image, name, emoji }: ProducerImageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-purple-900/20 rounded-3xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
        <img
          src={image}
          alt={name}
          className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border border-purple-900/30"
        />
        {emoji && (
          <motion.div 
            className="absolute -bottom-4 -right-4 bg-black/60 backdrop-blur-sm p-4 rounded-full border border-purple-500/30"
            animate={{ 
              scale: [1, 1.15, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span
              className="text-3xl block"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
              }}
            >
              {emoji}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ProducerImage;
