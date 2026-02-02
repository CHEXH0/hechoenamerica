import React, { useRef, useState } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { useProducers } from "@/hooks/useProducers";

const FeaturedProducers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: producers = [], isLoading } = useProducers();
  
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | 'none'>('none');
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const baseSpeed = 0.8; // pixels per frame
  
  // Calculate the reset point based on producer card width
  const itemWidth = 400 + 24; // approximate card width + gap
  const resetPoint = producers.length * itemWidth;

  useAnimationFrame(() => {
    if (scrollDirection === 'none' || producers.length === 0) return;
    
    const currentX = x.get();
    const speed = scrollDirection === 'left' ? -baseSpeed : baseSpeed;
    let newX = currentX + speed;
    
    // Seamless loop: reset position when we've scrolled one full set
    if (newX <= -resetPoint) {
      newX = 0;
    } else if (newX >= 0 && scrollDirection === 'right') {
      newX = -resetPoint + baseSpeed;
    }
    
    x.set(newX);
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const containerWidth = rect.width;
    const centerZone = containerWidth * 0.1; // 10% center zone
    
    if (mouseX < (containerWidth - centerZone) / 2) {
      setScrollDirection('left');
    } else if (mouseX > (containerWidth + centerZone) / 2) {
      setScrollDirection('right');
    } else {
      setScrollDirection('none');
    }
  };

  const handleMouseLeave = () => {
    setScrollDirection('none');
  };
  
  const handleProducerClick = (producerSlug: string) => {
    navigate(`/producer/${producerSlug}`);
  };

  // Duplicate producers for seamless infinite scroll
  const duplicatedProducers = [...producers, ...producers, ...producers];

  if (isLoading) {
    return (
      <section id="featured-producers" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
          >
            {t.featuredProducers.title}
          </motion.h2>
          <div className="grid grid-cols-2 gap-6">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-800 aspect-square rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-producers" className="py-20 bg-black overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white"
        >
          {t.featuredProducers.title}
        </motion.h2>
      </div>
      
      {/* Full-width scrolling container */}
      <div 
        ref={containerRef}
        className="w-full overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Gradient masks for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        
        {/* Infinite scrolling track */}
        <motion.div
          className="flex gap-6 px-6"
          style={{ x }}
        >
          {duplicatedProducers.map((producer, index) => (
            <motion.div
              key={`${producer.name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer flex-shrink-0 w-[400px]"
              onClick={() => handleProducerClick(producer.slug)}
            >
              <div className="relative overflow-hidden rounded-lg aspect-square">
                <img
                  src={producer.image}
                  alt={producer.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {producer.name}
                    <Music size={18} className="text-green-400" />
                  </h3>
                  <p className="text-sm text-gray-300">{producer.country}</p>
                  <p className="text-sm text-gray-300/50">{producer.genre}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducers;
