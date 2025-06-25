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
          <h1 className="text-5xl md:text-8xl font-bold mb-4 font-professional chrome-text-readable transform hover:scale-105 transition-transform duration-300">
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
          .chrome-text-readable {
            background: linear-gradient(
              135deg,
              #ffffff 0%,
              #e0e0e0 20%,
              #ffffff 40%,
              #c0c0c0 60%,
              #ffffff 80%,
              #f0f0f0 100%
            );
            background-size: 200% 200%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: 
              chromeShine 4s ease-in-out infinite,
              subtleGlow 3s ease-in-out infinite alternate;
            text-shadow: 
              0 0 10px rgba(255, 255, 255, 0.5),
              0 0 20px rgba(255, 255, 255, 0.3),
              0 0 30px rgba(255, 255, 255, 0.1);
            font-weight: 900;
            letter-spacing: 0.05em;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
          }
          
          @keyframes chromeShine {
            0%, 100% { 
              background-position: 0% 50%;
            }
            50% { 
              background-position: 100% 50%;
            }
          }
          
          @keyframes subtleGlow {
            0% { 
              text-shadow: 
                0 0 10px rgba(255, 255, 255, 0.5),
                0 0 20px rgba(255, 255, 255, 0.3),
                0 0 30px rgba(255, 255, 255, 0.1);
            }
            100% { 
              text-shadow: 
                0 0 15px rgba(255, 255, 255, 0.7),
                0 0 25px rgba(255, 255, 255, 0.4),
                0 0 35px rgba(255, 255, 255, 0.2);
            }
          }
        `}
      </style>
    </section>
  );
};

export default Hero;
