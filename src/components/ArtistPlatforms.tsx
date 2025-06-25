
import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Music } from "lucide-react";

interface ArtistPlatformsProps {
  spotifyUrl: string;
  youtubeUrl: string;
  appleMusicUrl: string;
}

const ArtistPlatforms = ({ spotifyUrl, youtubeUrl, appleMusicUrl }: ArtistPlatformsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1 }}
      className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl"
    >
      <h2 className="text-3xl font-bold mb-6 text-white">Listen On</h2>
      <div className="space-y-4">
        <motion.a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05, x: 10 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-5 rounded-2xl transition-all duration-100 shadow-lg hover:shadow-xl"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Music size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg flex-1">Spotify</span>
          <ExternalLink size={20} className="text-white" />
        </motion.a>

        <motion.a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05, x: 10 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 p-5 rounded-2xl transition-all duration-100 shadow-lg hover:shadow-xl"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Music size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg flex-1">YouTube Music</span>
          <ExternalLink size={20} className="text-white" />
        </motion.a>

        <motion.a
          href={appleMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05, x: 10 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 p-5 rounded-2xl transition-all duration-100 shadow-lg hover:shadow-xl"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Music size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg flex-1">Apple Music</span>
          <ExternalLink size={20} className="text-white" />
        </motion.a>
      </div>
    </motion.div>
  );
};

export default ArtistPlatforms;
