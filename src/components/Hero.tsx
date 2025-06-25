
import React from "react";
import Waveform from "./Waveform";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black" />
      </div>
      
      <div className="container mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-8">
            <img
              src="/lovable-uploads/d5eed490-6d34-4af5-8428-15981ab0f9c3.png"
              alt="HechoEnAmerica Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-gothic chrome-text">
            HECHO EN AMÉRICA
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            LA MUSIC ES MEDICINE
          </p>
          <Waveform />
        </motion.div>
      </div>
      
      <style>
        {`
          .chrome-text {
            background: linear-gradient(
              45deg,
              #c0c0c0 0%,
              #ffffff 15%,
              #c0c0c0 30%,
              #808080 45%,
              #ffffff 60%,
              #c0c0c0 75%,
              #ffffff 90%,
              #c0c0c0 100%
            );
            background-size: 200% 200%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: chromeShine 3s ease-in-out infinite;
            text-shadow: 
              0 0 10px rgba(192, 192, 192, 0.8),
              0 0 20px rgba(255, 255, 255, 0.6),
              0 0 30px rgba(192, 192, 192, 0.4);
          }
          
          @keyframes chromeShine {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>
    </section>
  );
};

export default Hero;
