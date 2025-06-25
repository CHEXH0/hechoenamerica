
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ArtistImageProps {
  image: string;
  name: string;
}

const ArtistImage = ({ image, name }: ArtistImageProps) => {
  const [showAngel, setShowAngel] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowAngel(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-red-900/20 rounded-3xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
        <img
          src={image}
          alt={name}
          className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border border-red-900/30"
        />
        <motion.div 
          className="absolute -bottom-4 -right-4 bg-black/60 backdrop-blur-sm p-4 rounded-full border border-red-500/30"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: showAngel ? 0 : 180
          }}
          transition={{ 
            scale: { duration: 1, repeat: Infinity },
            rotate: { duration: 0.5 }
          }}
        >
          <motion.div
            key={showAngel ? 'angel' : 'devil'}
            initial={{ opacity: 0, rotateY: -180 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 180 }}
            transition={{ duration: 0.5 }}
            className="text-3xl"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
              transform: 'perspective(100px) rotateX(15deg)'
            }}
          >
            {showAngel ? '😇' : '😈'}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ArtistImage;
