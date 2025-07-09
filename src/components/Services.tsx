import React from "react";
import { motion } from "framer-motion";
import { Headphones, Mic, Music, Radio } from "lucide-react";

const services = [
  {
    icon: Mic,
    title: "Recording",
    description: "Professional recording sessions in our state-of-the-art studio",
    image: "/laptop-uploads/recording.jpg",
  },
  {
    icon: Headphones,
    title: "Mixing & Mastering",
    description: "Expert mixing and mastering to bring your tracks to life",
    image: "/laptop-uploads/mixing-mastering.jpg",
  },
  {
    icon: Music,
    title: "Music Production",
    description: "Full music production services from concept to completion",
    image: "/laptop-uploads/AlbumCover.png",
  },
  {
    icon: Radio,
    title: "Artist Development",
    description: "Comprehensive artist development and career guidance",
    image: "/laptop-uploads/RIVERSIDE.jpg",
  },
];

const Services = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-purple-800/80 via-purple-900/60 to-black">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          Our Services
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group overflow-hidden rounded-xl bg-black/60 backdrop-blur-md border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300"
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
      </div>
    </section>
  );
};

export default Services;