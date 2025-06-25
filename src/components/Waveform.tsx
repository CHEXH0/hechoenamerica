
import React from "react";

const Waveform = () => {
  return (
    <div className="flex items-center justify-center gap-1 h-16 w-full">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-pink-400 via-red-400 to-orange-400 rounded-full animate-waveform opacity-80"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${Math.random() * 60 + 20}%`,
            animation: `waveform 2s ease-in-out infinite ${i * 0.1}s, colorShift 4s ease-in-out infinite ${i * 0.15}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveform {
          0%, 100% { 
            transform: scaleY(0.3);
            opacity: 0.4;
          }
          50% { 
            transform: scaleY(1);
            opacity: 0.9;
          }
        }
        @keyframes colorShift {
          0% { filter: hue-rotate(0deg) brightness(1); }
          25% { filter: hue-rotate(90deg) brightness(1.2); }
          50% { filter: hue-rotate(180deg) brightness(0.8); }
          75% { filter: hue-rotate(270deg) brightness(1.1); }
          100% { filter: hue-rotate(360deg) brightness(1); }
        }
      `}</style>
    </div>
  );
};

export default Waveform;
