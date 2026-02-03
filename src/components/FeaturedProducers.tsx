import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { Music, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducers } from "@/hooks/useProducers";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";

const FeaturedProducers = () => {
  const navigate = useNavigate();
  const { data: producers = [], isLoading } = useProducers();
  const isMobile = useIsMobile();
  
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | 'none'>('none');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const baseSpeed = 1.5;
  
  // Mobile swipe scroll with snap-to-card
  const mobileItemWidth = 280 + 16; // card width + gap
  const {
    scrollRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    scrollToDirection,
    updateScrollIndicators,
  } = useSwipeScroll({
    itemWidth: mobileItemWidth,
    onScrollChange: (left, right) => {
      setCanScrollLeft(left);
      setCanScrollRight(right);
    },
  });
  
  // Calculate the max scroll distance for desktop
  const itemWidth = 400 + 24;
  const maxScroll = producers.length > 0 ? (producers.length - 2) * itemWidth : 0;

  useAnimationFrame(() => {
    if (scrollDirection === 'none' || producers.length === 0) return;
    
    const currentX = x.get();
    const speed = scrollDirection === 'left' ? -baseSpeed : baseSpeed;
    let newX = currentX + speed;
    
    // Clamp to boundaries - stop at ends
    if (newX > 0) {
      newX = 0;
    } else if (newX < -maxScroll) {
      newX = -maxScroll;
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
      setScrollDirection('right'); // Mouse on left = scroll right
    } else if (mouseX > (containerWidth + centerZone) / 2) {
      setScrollDirection('left'); // Mouse on right = scroll left
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

  // No duplication needed - using the original producers list
  const displayProducers = producers;

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
            Featured Producers
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
            Featured Producers
        </motion.h2>
      </div>
      
      {/* Full-width scrolling container */}
      <div className="relative">
        {/* Mobile scroll indicators */}
        {isMobile && (
          <>
            <button
              onClick={() => scrollToDirection('left')}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => scrollToDirection('right')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        <div 
          ref={isMobile ? scrollRef : containerRef}
          className={`w-full relative ${isMobile ? 'overflow-x-auto scrollbar-hide touch-pan-x' : 'overflow-hidden'}`}
          onMouseMove={!isMobile ? handleMouseMove : undefined}
          onMouseLeave={!isMobile ? handleMouseLeave : undefined}
          onScroll={isMobile ? updateScrollIndicators : undefined}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {/* Gradient masks for smooth fade effect - desktop only */}
          {!isMobile && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            </>
          )}
          
          {/* Scrolling track */}
          {isMobile ? (
            <div className="flex gap-4 px-4 snap-x snap-mandatory">
              {displayProducers.map((producer, index) => (
                <motion.div
                  key={`${producer.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="relative group cursor-pointer flex-shrink-0 w-[280px] snap-start"
                  onClick={() => handleProducerClick(producer.slug)}
                >
                  <div className="relative overflow-hidden rounded-lg aspect-square">
                    <img
                      src={producer.image}
                      alt={producer.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        {producer.name}
                        <Music size={16} className="text-green-400" />
                      </h3>
                      <p className="text-xs text-gray-300">{producer.country}</p>
                      <p className="text-xs text-gray-300/50">{producer.genre}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="flex gap-6 px-6"
              style={{ x }}
            >
              {displayProducers.map((producer, index) => (
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
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducers;
