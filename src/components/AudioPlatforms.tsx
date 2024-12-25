import React from "react";
import { motion } from "framer-motion";

const platforms = [
  {
    name: "Spotify",
    icon: "🎵",
    url: "#",
  },
  {
    name: "Apple Music",
    icon: "🎵",
    url: "#",
  },
  {
    name: "SoundCloud",
    icon: "🎵",
    url: "#",
  },
  {
    name: "YouTube Music",
    icon: "🎵",
    url: "#",
  },
];

const AudioPlatforms = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          Listen Now
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <motion.a
              key={platform.name}
              href={platform.url}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center justify-center p-6 rounded-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <span className="text-3xl mb-4">{platform.icon}</span>
              <span className="text-white font-medium">{platform.name}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudioPlatforms;