
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
          <h1 className="text-5xl md:text-8xl font-bold mb-4 font-professional chrome-text-spiky transform hover:scale-105 transition-transform duration-300">
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
          .chrome-text-spiky {
            background: linear-gradient(
              45deg,
              #ffffff 0%,
              #e8e8e8 15%,
              #ffffff 25%,
              #d0d0d0 35%,
              #ffffff 45%,
              #c8c8c8 55%,
              #ffffff 65%,
              #e0e0e0 75%,
              #ffffff 85%,
              #f8f8f8 100%
            );
            background-size: 300% 300%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: chromeShine 3s ease-in-out infinite;
            text-shadow: 
              2px 2px 0px rgba(0, 0, 0, 0.8),
              4px 4px 0px rgba(0, 0, 0, 0.6),
              6px 6px 0px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(255, 255, 255, 0.6),
              0 0 40px rgba(255, 255, 255, 0.4);
            font-weight: 900;
            letter-spacing: 0.1em;
            filter: 
              drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.7))
              drop-shadow(-1px -1px 0px rgba(255, 255, 255, 0.3));
            transform: 
              perspective(500px) 
              rotateX(15deg) 
              skewX(-5deg);
            position: relative;
          }
          
          .chrome-text-spiky::before {
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
            z-index: -1;
            clip-path: polygon(
              0% 20%, 5% 0%, 15% 25%, 25% 5%, 35% 30%, 45% 10%, 
              55% 35%, 65% 15%, 75% 40%, 85% 20%, 95% 45%, 100% 25%,
              100% 75%, 95% 100%, 85% 80%, 75% 95%, 65% 85%, 55% 90%,
              45% 85%, 35% 95%, 25% 80%, 15% 90%, 5% 75%, 0% 85%
            );
            animation: spikeGlow 4s ease-in-out infinite;
          }
          
          @keyframes chromeShine {
            0%, 100% { 
              background-position: 0% 50%;
            }
            50% { 
              background-position: 100% 50%;
            }
          }
          
          @keyframes spikeGlow {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 0.7;
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </section>
  );
};

export default Hero;
