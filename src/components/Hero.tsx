import React from "react";
import Waveform from "./Waveform";
import LanguageSelector from "./LanguageSelector";
import ProfileIcon from "./ProfileIcon";
import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/TranslationContext";

const Hero = () => {
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Header Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <ProfileIcon />
        <LanguageSelector />
      </div>
      
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black" />
      </div>
      
      <div className="container mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-8">
            <img
              src="/lovable-uploads/d5eed490-6d34-4af5-8428-15981ab0f9c3.png"
              alt="HechoEnAmerica Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            {t.hero.subtitle}
          </p>
          <Waveform />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;