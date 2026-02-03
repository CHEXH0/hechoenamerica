import React, { useRef, useState } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { Headphones, Mic, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import abletonLogo from "@/assets/ableton-logo.png";

const Services = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Mobile swipe scroll with snap-to-card
  const mobileItemWidth = 144 + 16; // card width (w-36) + gap
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
      name: "Pro Tools",
      logo: "/laptop-uploads/ProTools.png",
      tagline: "Work with anyone, anywhere",
    },
    {
      name: "Ableton Live",
      logo: abletonLogo,
      tagline: "Creative tools for music makers",
    },
    {
      name: "FL Studio",
      logo: "/laptop-uploads/FLoops.png",
      tagline: "Create your best music",
    },
    {
      name: "Cubase",
      logo: "/laptop-uploads/Cubase.png",
      tagline: "Professional music production",
    },
    {
      name: "Logic Pro",
      logo: "/lovable-uploads/b0915421-1e88-4e72-af78-b3f03acea982.png",
      tagline: "Powerful. Creative. Intuitive.",
    },
    {
      name: "Studio One",
      logo: "/lovable-uploads/d5eed490-6d34-4af5-8428-15981ab0f9c3.png",
      tagline: "The future of recording",
    },
    {
      name: "Reason",
      logo: "/laptop-uploads/Synth.png",
      tagline: "Make music your way",
    },
    {
      name: "Reaper",
      logo: "/laptop-uploads/mixing-mastering.jpg",
      tagline: "Digital audio workstation",
    },
  ];

  // Duplicate platforms for seamless infinite scroll
  const duplicatedPlatforms = [...platforms, ...platforms, ...platforms];
  
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | 'none'>('none');
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const baseSpeed = 0.8;
  
  // Calculate the reset point (one full set of platforms)
  const itemWidth = 176 + 24;
  const resetPoint = platforms.length * itemWidth;

  useAnimationFrame(() => {
    if (scrollDirection === 'none') return;
    
    const currentX = x.get();
    const speed = scrollDirection === 'left' ? -baseSpeed : baseSpeed;
    let newX = currentX + speed;
    
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
    const centerZone = containerWidth * 0.1;
    
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

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-800/80 via-purple-900/60 to-black overflow-hidden">
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

        {/* DAW Platforms Scrolling Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <h3 className="text-xl md:text-2xl font-semibold text-center text-white/80 mb-8">
            We work with industry-standard DAWs
          </h3>
        </motion.div>
      </div>
      
      {/* Full-width scrolling container - outside the container */}
      <div className="relative mt-8">
        {/* Mobile scroll indicators */}
        {isMobile && (
          <>
            <button
              onClick={() => scrollToDirection('left')}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => scrollToDirection('right')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-white" />
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
              {platforms.map((platform, index) => (
                <div
                  key={`${platform.name}-${index}`}
                  className="flex-shrink-0 w-36 bg-black/40 backdrop-blur-md border border-purple-400/20 rounded-xl p-4 text-center snap-start"
                >
                  <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-lg flex items-center justify-center">
                    <img 
                      src={platform.logo} 
                      alt={`${platform.name} logo`} 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-white mb-1">{platform.name}</h4>
                  <p className="text-purple-300 text-[10px] italic leading-tight">"{platform.tagline}"</p>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="flex gap-6"
              style={{ x }}
            >
              {duplicatedPlatforms.map((platform, index) => (
                <div
                  key={`${platform.name}-${index}`}
                  className="flex-shrink-0 w-44 bg-black/40 backdrop-blur-md border border-purple-400/20 rounded-xl p-5 text-center hover:border-purple-400/40 hover:bg-black/60 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 mx-auto mb-3 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <img 
                      src={platform.logo} 
                      alt={`${platform.name} logo`} 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{platform.name}</h4>
                  <p className="text-purple-300 text-xs italic">"{platform.tagline}"</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Services;
