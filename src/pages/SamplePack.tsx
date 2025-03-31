
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Music, Music2, PlayCircle } from "lucide-react";

// Sample data - in a real app, this would come from a database or API
const sampleCategories = [
  {
    id: "samples",
    title: "Audio Samples",
    description: "High quality audio samples for your productions",
    icon: <Music className="h-8 w-8 text-primary" />,
    items: [
      { name: "Drum Kit - Latino Heat", type: "WAV", price: "Free" },
      { name: "Bass Loops Collection", type: "WAV", price: "$19.99" },
      { name: "Vocal Chops - Spanish Edition", type: "WAV/MP3", price: "$14.99" },
      { name: "Percussion Essentials", type: "WAV", price: "Free" },
    ]
  },
  {
    id: "sounds",
    title: "Premium Sounds",
    description: "Professionally engineered sounds for music producers",
    icon: <Music2 className="h-8 w-8 text-primary" />,
    items: [
      { name: "Reggaeton Presets", type: "VST/AU", price: "$29.99" },
      { name: "Latin Piano Collection", type: "WAV/MIDI", price: "$24.99" },
      { name: "Urban Bass Designer", type: "VST", price: "$39.99" },
      { name: "Analog Synth Pack", type: "WAV", price: "Free" },
    ]
  },
  {
    id: "videos",
    title: "Tutorial Videos",
    description: "Learn production techniques from HechoEnAmerica Studio",
    icon: <PlayCircle className="h-8 w-8 text-primary" />,
    items: [
      { name: "Mixing Vocals Like a Pro", type: "Video", price: "Free" },
      { name: "Mastering Basics", type: "Video", price: "Free" },
      { name: "Creating Reggaeton Beats", type: "Video", price: "$9.99" },
      { name: "Advanced Production Techniques", type: "Video", price: "$19.99" },
    ]
  },
];

const SamplePack = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="flex items-center text-white hover:text-primary transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-6 text-center"
        >
          HechoEnAmerica Sample Collection
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-center mb-12 max-w-3xl mx-auto text-gray-300"
        >
          Explore our curated collection of professional samples, sounds, and educational content
        </motion.p>
        
        <div className="space-y-16">
          {sampleCategories.map((category, index) => (
            <motion.section 
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="pb-8"
            >
              <div className="flex items-center justify-center mb-8">
                <div className="bg-white/10 p-4 rounded-full mr-4">
                  {category.icon}
                </div>
                <h2 className="text-3xl font-bold">{category.title}</h2>
              </div>
              
              <p className="text-center text-gray-300 mb-8 max-w-2xl mx-auto">
                {category.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((item, itemIndex) => (
                  <motion.div
                    key={`${category.id}-${itemIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: itemIndex * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-gray-400">{item.type}</span>
                      <span className={`${item.price === "Free" ? "text-green-400" : "text-white"} font-medium`}>
                        {item.price}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-medium mb-4">Need custom samples?</h3>
          <p className="mb-6 text-gray-300">Contact us for custom sample packs or production services</p>
          <Link 
            to="/" 
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Get in Touch
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SamplePack;
