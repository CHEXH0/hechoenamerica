import React from "react";

const Waveform = () => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 h-full bg-studio-red opacity-50 animate-waveform"
          style={{
            animationDelay: `${i * 0.05}s`,
            transform: `scaleY(${Math.random() * 0.5 + 0.2})`,
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;