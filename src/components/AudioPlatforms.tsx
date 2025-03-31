
import React from "react";
import { motion } from "framer-motion";

const platforms = [
  {
    name: "Instagram",
    image: "/laptop-uploads/Instagram.png",
    url: "https://www.instagram.com/hecho.en.america/",
  },
  {
    name: "YouTube",
    image: "/laptop-uploads/YouTube.png",
    url: "https://www.youtube.com/@HechoEnAmerica.",
  },
  {
    name: "WhatsApp",
    image: "/laptop-uploads/x.png", // Reusing the X image for WhatsApp
    url: "https://wa.me/message/YOUR_NUMBER", // Replace with actual WhatsApp contact link
  },
  {
    name: "Sample Pack",
    image: "/laptop-uploads/TikTok.png", // Reusing TikTok image for Sample Pack
    url: "#", // Add actual download link when available
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
              target="_blank"
              rel="noopener noreferrer"
              key={platform.name}
              href={platform.url}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center justify-center p-6 rounded-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <img src={platform.image} alt={platform.name} className="w-16 h-16 mb-4" />
              <span className="text-white font-medium">{platform.name}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudioPlatforms;
