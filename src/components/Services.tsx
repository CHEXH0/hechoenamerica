import React from "react";
import { motion } from "framer-motion";
import { Headphones, Mic, Music } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

const Services = () => {
  const { t } = useTranslation();

  const services = [
    {
      title: "Audios",
      description: "Enhancing your audios and submissions for quality production",
      image: "/laptop-uploads/Star.png",
      icon: Mic,
    },
    {
      title: "Mixing",
      description: "Expert mixing to bring your tracks to life",
      image: "/laptop-uploads/Donut.png",
      icon: Headphones,
    },
    {
      title: "Mastering",
      description: "Final polish to make your music shine",
      image: "/laptop-uploads/Pill.png",
      icon: Music,
    },
  ];

  const platforms = [
    {
      name: "ProTools",
      logo: "/laptop-uploads/ProTools.png",
      tools: ['"Work with anyone, anywhere"'],
    },
    {
      name: "Cubase",
      logo: "/laptop-uploads/Cubase.png",
      tools: ['"Keeps your creativty flowing"'],
    },
    {
      name: "FL Studio",
      logo: "/laptop-uploads/FLoops.png",
      tools: ['"Create your best music"'],
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800/80 via-purple-900/60 to-black">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          {t.services.title}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group rounded-xl bg-black backdrop-blur-md border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 overflow-visible"
            >
              <div className="aspect-square">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-5/6 h-5/6 object-contain group-hover:scale-110 transition-transform duration-300 rounded-xl mx-auto mt-4"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <div className="flex items-center mb-3">
                  <service.icon className="h-6 w-6 text-purple-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platforms Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-black/40 backdrop-blur-md border border-purple-400/20 rounded-xl p-6 text-center hover:border-purple-400/40 transition-all duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                  <img src={platform.logo} alt={`${platform.name} logo`} className="w-12 h-12 object-contain" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">{platform.name}</h4>
                <div className="space-y-1 pb-4">
                  {platform.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-400/30 mr-1 mb-1"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
