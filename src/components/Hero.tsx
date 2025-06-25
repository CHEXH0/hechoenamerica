
import React, { useEffect, useState } from "react";
import Waveform from "./Waveform";
import { motion } from "framer-motion";

const Hero = () => {
  const [logoColor, setLogoColor] = useState({ r: 255, g: 255, b: 255 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Generate dynamic RGB values that cycle through different colors
      const time = Date.now() * 0.001;
      const r = Math.floor(128 + 127 * Math.sin(time * 0.5));
      const g = Math.floor(128 + 127 * Math.sin(time * 0.7 + 2));
      const b = Math.floor(128 + 127 * Math.sin(time * 0.9 + 4));
      setLogoColor({ r, g, b });
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
              className="w-full h-full object-contain transition-all duration-100"
              style={{
                filter: `hue-rotate(${(logoColor.r + logoColor.g + logoColor.b) / 3}deg) saturate(1.2)`,
                dropShadow: `0 0 20px rgb(${logoColor.r}, ${logoColor.g}, ${logoColor.b})`
              }}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 relative">
            <span className="melting-text">
              HECHO EN AMÉRICA
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            LA MUSIC ES MEDICINE
          </p>
          <Waveform />
        </motion.div>
      </div>

      <style jsx>{`
        .melting-text {
          background: linear-gradient(
            45deg,
            #ff6b6b,
            #feca57,
            #48dbfb,
            #ff9ff3,
            #54a0ff
          );
          background-size: 400% 400%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: melt 4s ease-in-out infinite, gradient 6s ease infinite;
          position: relative;
        }

        .melting-text::before {
          content: "HECHO EN AMÉRICA";
          position: absolute;
          top: 0;
          left: 0;
          background: linear-gradient(
            180deg,
            transparent 60%,
            rgba(255, 107, 107, 0.8) 70%,
            rgba(254, 202, 87, 0.9) 80%,
            rgba(72, 219, 251, 0.7) 90%,
            rgba(255, 159, 243, 0.8) 100%
          );
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: drip 3s ease-in-out infinite;
          filter: blur(1px);
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes melt {
          0%, 100% { 
            transform: scaleY(1) skewX(0deg);
            filter: blur(0px);
          }
          25% { 
            transform: scaleY(1.05) skewX(-2deg);
            filter: blur(0.5px);
          }
          50% { 
            transform: scaleY(0.98) skewX(1deg);
            filter: blur(1px);
          }
          75% { 
            transform: scaleY(1.02) skewX(-1deg);
            filter: blur(0.5px);
          }
        }

        @keyframes drip {
          0%, 60% { 
            transform: scaleY(1) translateY(0px);
            opacity: 0;
          }
          70% { 
            transform: scaleY(1.1) translateY(2px);
            opacity: 0.7;
          }
          80% { 
            transform: scaleY(1.3) translateY(5px);
            opacity: 0.9;
          }
          90% { 
            transform: scaleY(1.5) translateY(8px);
            opacity: 0.6;
          }
          100% { 
            transform: scaleY(1.8) translateY(12px);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
