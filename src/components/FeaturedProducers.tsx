import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Music, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { useProducers } from "@/hooks/useProducers";
import { Button } from "@/components/ui/button";

const FeaturedProducers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: producers = [], isLoading } = useProducers();
  
  const handleProducerClick = (producerSlug: string) => {
    navigate(`/producer/${producerSlug}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
        
        <div className="relative">
          {/* Scroll Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full hidden md:flex"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full hidden md:flex"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {producers.map((producer, index) => (
              <motion.div
                key={producer.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer flex-shrink-0 w-[calc(50%-12px)] snap-start"
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
          </div>
          
          {/* Scroll Indicator Dots */}
          {producers.length > 2 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.ceil(producers.length / 2) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({
                        left: i * scrollRef.current.offsetWidth,
                        behavior: 'smooth'
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducers;
