import React from "react";
import { useNavigate } from "react-router-dom";
import Waveform from "./Waveform";
import ProfileIcon from "./ProfileIcon";
import CustomerServicePanel from "./CustomerServicePanel";
import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/TranslationContext";

const Hero = React.memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: producers = [], isLoading } = useProducers();
  const displayProducers = React.useMemo(() => {
    const shuffled = [...producers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 6);
  }, [producers]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white pb-12">
      {/* Header Controls */}
      <div className="absolute top-4 right-14 z-20 flex items-center gap-1">
        <CustomerServicePanel />
        <ProfileIcon />
      </div>
      
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black" />
      </div>
      
      <div className="container mx-auto px-4 z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div 
            className="w-32 h-32 mx-auto mb-8"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <img
              src="/laptop-uploads/HEA_White.png"
              alt="HechoEnAmerica Logo"
              className="w-full h-full object-contain"
              loading="eager"
              fetchPriority="high"
            />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-wider" style={{ textShadow: '0 4px 30px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)' }}>
            {t.hero.title}
          </h1>
          <div className="animate-color-shift mb-8 inline-block">
            <p className="text-lg md:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-purple-300">
              {t.hero.subtitle}
            </p>
          </div>
          <Waveform />
        </motion.div>

        {/* Producers strip below waveform */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music size={16} className="text-green-400" />
            <span className="text-sm text-gray-400 uppercase tracking-widest">
              {t.featuredProducers?.title || "Featured Producers"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-14 h-14 rounded-full bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : displayProducers.length > 0 ? (
            <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
              {displayProducers.map((producer, index) => (
                <motion.button
                  key={producer.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.08 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => navigate(`/producer/${producer.slug}`)}
                  className="relative group flex-shrink-0"
                  title={producer.name}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-green-400/60 transition-colors">
                    <img
                      src={producer.image}
                      alt={producer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {producer.name}
                  </span>
                </motion.button>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + displayProducers.length * 0.08 }}
              >
                <Link
                  to="/producers"
                  className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/20 hover:border-purple-400/60 text-gray-400 hover:text-purple-300 text-xs font-medium transition-colors"
                >
                  All
                </Link>
              </motion.div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;