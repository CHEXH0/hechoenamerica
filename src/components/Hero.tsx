

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
          <h1 className="text-5xl md:text-8xl font-bold mb-4 font-gothic chrome-text-extreme transform hover:scale-105 transition-transform duration-300">
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
          .chrome-text-extreme {
            background: linear-gradient(
              90deg,
              #ff0000 0%,
              #ff8c00 10%,
              #ffd700 20%,
              #ffffff 30%,
              #00ffff 40%,
              #0080ff 50%,
              #8000ff 60%,
              #ff00ff 70%,
              #ff0080 80%,
              #ffffff 90%,
              #ff0000 100%
            );
            background-size: 400% 400%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: 
              chromeRainbow 2s linear infinite,
              chromePulse 1.5s ease-in-out infinite alternate,
              chromeGlow 3s ease-in-out infinite;
            text-shadow: 
              0 0 20px rgba(255, 255, 255, 1),
              0 0 40px rgba(255, 0, 255, 0.8),
              0 0 60px rgba(0, 255, 255, 0.6),
              0 0 80px rgba(255, 215, 0, 0.4),
              0 0 100px rgba(255, 0, 0, 0.2);
            font-weight: 900;
            letter-spacing: 0.1em;
            transform: perspective(1000px) rotateX(15deg);
            filter: 
              drop-shadow(0 10px 20px rgba(255, 255, 255, 0.3))
              drop-shadow(0 0 50px rgba(255, 0, 255, 0.5));
          }
          
          @keyframes chromeRainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
          
          @keyframes chromePulse {
            0% { 
              transform: perspective(1000px) rotateX(15deg) scale(1);
              filter: 
                drop-shadow(0 10px 20px rgba(255, 255, 255, 0.3))
                drop-shadow(0 0 50px rgba(255, 0, 255, 0.5));
            }
            100% { 
              transform: perspective(1000px) rotateX(15deg) scale(1.05);
              filter: 
                drop-shadow(0 15px 30px rgba(255, 255, 255, 0.6))
                drop-shadow(0 0 80px rgba(255, 0, 255, 0.8))
                drop-shadow(0 0 100px rgba(0, 255, 255, 0.6));
            }
          }
          
          @keyframes chromeGlow {
            0%, 100% { 
              text-shadow: 
                0 0 20px rgba(255, 255, 255, 1),
                0 0 40px rgba(255, 0, 255, 0.8),
                0 0 60px rgba(0, 255, 255, 0.6),
                0 0 80px rgba(255, 215, 0, 0.4),
                0 0 100px rgba(255, 0, 0, 0.2);
            }
            50% { 
              text-shadow: 
                0 0 30px rgba(255, 255, 255, 1),
                0 0 60px rgba(255, 0, 255, 1),
                0 0 90px rgba(0, 255, 255, 0.8),
                0 0 120px rgba(255, 215, 0, 0.6),
                0 0 150px rgba(255, 0, 0, 0.4);
            }
          }
        `}
      </style>
    </section>
  );
};

export default Hero;

