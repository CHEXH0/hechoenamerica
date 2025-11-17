import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { useProducers } from "@/hooks/useProducers";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const PRODUCERS_PER_PAGE = 4;

const FeaturedProducers = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { data: producers = [], isLoading } = useProducers();
  
  const totalPages = Math.ceil(producers.length / PRODUCERS_PER_PAGE);
  
  const handleProducerClick = (producerSlug: string) => {
    navigate(`/producer/${producerSlug}`);
  };
  
  const indexOfLastProducer = currentPage * PRODUCERS_PER_PAGE;
  const indexOfFirstProducer = indexOfLastProducer - PRODUCERS_PER_PAGE;
  const currentProducers = producers.slice(indexOfFirstProducer, indexOfLastProducer);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-800 aspect-square rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("featured-producers")?.scrollIntoView({ behavior: "smooth" });
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentProducers.map((producer, index) => (
            <motion.div
              key={producer.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group cursor-pointer"
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
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <Pagination>
              <PaginationContent className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={`text-white hover:bg-white/20 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className={`text-white cursor-pointer ${
                        currentPage === page 
                          ? 'bg-white/30 hover:bg-white/40' 
                          : 'hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={`text-white hover:bg-white/20 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducers;
