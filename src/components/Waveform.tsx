
import React from "react";

const Waveform = () => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 h-full opacity-75 animate-waveform"
          style={{
            animationDelay: `${i * 0.05}s`,
            transform: `scaleY(${Math.random() * 0.5 + 0.2})`,
            backgroundColor: `hsl(${(i * 9 + Date.now() / 50) % 360}, 70%, 60%)`,
            animation: `waveform 1.5s ease-in-out infinite ${i * 0.05}s, colorShift 3s ease-in-out infinite ${i * 0.1}s`,
          }}
        />
      ))}
      <style>
        {`
          @keyframes colorShift {
            0% { filter: hue-rotate(0deg); }
            25% { filter: hue-rotate(90deg); }
            50% { filter: hue-rotate(180deg); }
            75% { filter: hue-rotate(270deg); }
            100% { filter: hue-rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Waveform;
