import React from "react";
import { motion } from "framer-motion";
import { Headphones, Mic, Music, Radio } from "lucide-react";
import protoolsLogo from "@/assets/protools-logo.png";
import cubaseLogo from "@/assets/cubase-logo.png";
import flStudioLogo from "@/assets/fl-studio-logo.png";
import tigerRoar from "@/assets/tiger-roar.png";

const services = [
  {
    icon: Mic,
    title: "Recording",
    description: "Professional recording sessions in our state-of-the-art studio",
    image: "/laptop-uploads/recording.jpg",
  },
  {
    icon: Headphones,
    title: "Mixing",
    description: "Expert mixing to balance and enhance your tracks",
    image: "/laptop-uploads/mixing-mastering.jpg",
  },
  {
    icon: Music,
    title: "Mastering",
    description: "Professional mastering for the final polish and industry-ready sound",
    image: "/laptop-uploads/AlbumCover.png",
  },
];

const platforms = [
  {
    name: "ProTools",
    logo: protoolsLogo,
    tools: ["EQ III", "Compressor", "DeEsser", "Reverb One"]
  },
  {
    name: "Cubase", 
    logo: cubaseLogo,
    tools: ["VST Instruments", "Channel EQ", "Compressor", "Reverb"]
  },
  {
    name: "FL Studio",
    logo: flStudioLogo,
    tools: ["Parametric EQ 2", "Fruity Compressor", "Reverb 2", "Delay 3"]
  }
];

const Services = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800/80 via-purple-900/60 to-black">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          Our Services
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group overflow-hidden rounded-xl bg-black backdrop-blur-md border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center mb-3">
                  <service.icon className="h-6 w-6 text-purple-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {service.description}
                </p>
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
          <div className="flex justify-center mb-8">
            <img 
              src={tigerRoar} 
              alt="Tiger"
              className="w-24 h-24 object-contain"
            />
          </div>
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
                  <img 
                    src={platform.logo} 
                    alt={`${platform.name} logo`}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">{platform.name}</h4>
                <div className="space-y-1">
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