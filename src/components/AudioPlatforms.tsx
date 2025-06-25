
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
    emojis: ["📸", "❤️", "👥", "✨", "🔥"],
  },
  {
    name: "YouTube",
    image: "/laptop-uploads/YouTube.png",
    url: "https://www.youtube.com/@HechoEnAmerica.",
    isExternal: true,
    emojis: ["📺", "🎬", "👀", "🔴", "🎵"],
  },
  {
    name: "WhatsApp",
    image: "/laptop-uploads/whatsapp.svg",
    url: "https://chat.whatsapp.com/GfhMoPNoJs49pp4nti7uwU",
    isExternal: true,
    emojis: ["💬", "📱", "👥", "💚", "📞"],
  },
  {
    name: "Sample Pack",
    isIcon: true,
    url: "/coming-soon",
    isExternal: false,
    emojis: ["🎧", "🎵", "🎤", "🎹", "🎶"],
  },
];

const AudioPlatforms = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black via-gray-900 to-purple-950/60">
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
                  className="relative flex flex-col items-center justify-center p-6 rounded-lg bg-black/80 backdrop-blur-md border border-purple-400/20 hover:bg-black/90 hover:border-purple-400/30 transition-all duration-300 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                >
                  {/* Blurry emoji decorations */}
                  <div className="absolute top-2 left-3 text-sm opacity-25 blur-sm pointer-events-none z-10">{platform.emojis[0]}</div>
                  <div className="absolute top-4 right-4 text-xs opacity-20 blur-sm pointer-events-none z-10">{platform.emojis[1]}</div>
                  <div className="absolute bottom-3 left-6 text-xs opacity-15 blur-sm pointer-events-none z-10">{platform.emojis[2]}</div>
                  <div className="absolute bottom-5 right-2 text-sm opacity-20 blur-sm pointer-events-none z-10">{platform.emojis[3]}</div>
                  <div className="absolute top-6 left-8 text-xs opacity-10 blur-sm pointer-events-none z-10">{platform.emojis[4]}</div>
                  
                  <img src={platform.image} alt={platform.name} className="w-16 h-16 mb-4 relative z-20" />
                  <span className="text-white font-medium relative z-20">{platform.name}</span>
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
                  className="relative flex flex-col items-center justify-center p-6 rounded-lg bg-black/80 backdrop-blur-md border border-purple-400/20 hover:bg-black/90 hover:border-purple-400/30 transition-all duration-300 w-full h-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                >
                  {/* Blurry emoji decorations */}
                  <div className="absolute top-2 left-3 text-sm opacity-25 blur-sm pointer-events-none z-10">{platform.emojis[0]}</div>
                  <div className="absolute top-4 right-4 text-xs opacity-20 blur-sm pointer-events-none z-10">{platform.emojis[1]}</div>
                  <div className="absolute bottom-3 left-6 text-xs opacity-15 blur-sm pointer-events-none z-10">{platform.emojis[2]}</div>
                  <div className="absolute bottom-5 right-2 text-sm opacity-20 blur-sm pointer-events-none z-10">{platform.emojis[3]}</div>
                  <div className="absolute top-6 left-8 text-xs opacity-10 blur-sm pointer-events-none z-10">{platform.emojis[4]}</div>
                  
                  {platform.isIcon ? (
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4 relative z-20">
                      <ArrowRight className="h-8 w-8 text-white" />
                    </div>
                  ) : (
                    <img src={platform.image} alt={platform.name} className="w-16 h-16 mb-4 relative z-20" />
                  )}
                  <span className="text-white font-medium relative z-20">{platform.name}</span>
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
