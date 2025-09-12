
import React from "react";

const bars = Array.from({ length: 40 });

const Waveform = React.memo(() => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-0.5 h-full opacity-75 animate-waveform"
          style={{
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>
        {`
          /* Keep animations purely CSS-based and deterministic */
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
});

export default Waveform;
