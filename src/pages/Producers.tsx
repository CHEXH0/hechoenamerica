import React from "react";
import { motion } from "framer-motion";
import { Music, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useProducers } from "@/hooks/useProducers";

const Producers = () => {
  const navigate = useNavigate();
  const { data: producers = [], isLoading } = useProducers();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold heading-gradient">
            All Producers
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 aspect-square rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {producers.map((producer, index) => (
              <motion.div
                key={producer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="relative group cursor-pointer"
                onClick={() => navigate(`/producer/${producer.slug}`)}
              >
                <div className="relative overflow-hidden rounded-lg aspect-square">
                  <img
                    src={producer.image}
                    alt={producer.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
        )}
      </div>
    </div>
  );
};

export default Producers;
