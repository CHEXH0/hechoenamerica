
import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface ArtistInfoProps {
  name: string;
  country: string;
  genre: string;
}

const ArtistInfo = ({ name, country, genre }: ArtistInfoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl"
    >
      <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white bg-gradient-to-r from-white to-white/80 bg-clip-text">
        {name}
      </h1>
      <div className="flex items-center gap-2 text-white/90 text-xl mb-2">
        <MapPin size={20} />
        {country}
      </div>
      <p className="text-white/70 text-lg">{genre}</p>
    </motion.div>
  );
};

export default ArtistInfo;
