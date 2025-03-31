
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const platforms = [
  {
    name: "Instagram",
    image: "/laptop-uploads/Instagram.png",
    url: "https://www.instagram.com/hecho.en.america/",
    isExternal: true,
  },
  {
    name: "YouTube",
    image: "/laptop-uploads/YouTube.png",
    url: "https://www.youtube.com/@HechoEnAmerica.",
    isExternal: true,
  },
  {
    name: "WhatsApp",
    image: "/laptop-uploads/whatsapp.svg", // Reusing the X image for WhatsApp
    url: "https://chat.whatsapp.com/GfhMoPNoJs49pp4nti7uwU", // Replace with actual WhatsApp contact link
    isExternal: true,
  },
  {
    name: "Sample Pack",
    isIcon: true, // New property to indicate we're using an icon instead of an image
    url: "/sample-pack",
    isExternal: false,
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
          {platforms.map((platform, index) => {
            // For external links, render an anchor tag
            if (platform.isExternal) {
              return (
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
              );
            }
            
            // For internal links, use React Router's Link component
            return (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link
                  to={platform.url}
                  className="flex flex-col items-center justify-center p-6 rounded-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 w-full h-full"
                >
                  {platform.isIcon ? (
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
                      <ArrowRight className="h-8 w-8 text-white" />
                    </div>
                  ) : (
                    <img src={platform.image} alt={platform.name} className="w-16 h-16 mb-4" />
                  )}
                  <span className="text-white font-medium">{platform.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AudioPlatforms;
