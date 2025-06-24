
import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Music, MapPin } from "lucide-react";

const artists = [
  {
    id: "chexho",
    name: "CHEXHO",
    image: "/laptop-uploads/AlbumCover.png",
    country: "California, USA",
    genre: "Alternative R&B, Musica Medicina",
    bio: "CHEXHO is an innovative artist blending Alternative R&B with Musica Medicina, creating transformative musical experiences that heal and inspire.",
    spotifyUrl: "https://open.spotify.com/artist/51oO373JL3YH8dvT6v94xg?si=EgGVOngeRTaejIWl3TYqkA",
    youtubeUrl: "https://music.youtube.com/channel/UC...",
    appleMusicUrl: "https://music.apple.com/artist/...",
  },
  {
    id: "jiesson-diaz-santiago",
    name: "Jiesson Diaz Santiago",
    image: "/laptop-uploads/Jiesson.png",
    country: "Bogotá, Colombia",
    genre: "Musica Medicina",
    bio: "Based in Bogotá, Jiesson Diaz Santiago crafts healing soundscapes through Musica Medicina, connecting listeners to their inner wisdom.",
    spotifyUrl: "https://open.spotify.com/artist/5MpXNiUTlKk7WmwEYhnVaC?si=BOfW5qmwRFWNMhnjhOa0Fw",
    youtubeUrl: "https://music.youtube.com/channel/UC...",
    appleMusicUrl: "https://music.apple.com/artist/...",
  },
  {
    id: "nick-zinchenko",
    name: "Nick Zinchenko",
    image: "/laptop-uploads/Zinchenko.png",
    country: "Luhansk, Ukraine",
    genre: "Hip Hop, Trap, R&B",
    bio: "Nick Zinchenko brings authentic Eastern European energy to Hip Hop, Trap, and R&B, creating powerful narratives through his music.",
    spotifyUrl: "https://open.spotify.com/artist/5MNMLU5i9pBJCNh9kEP9F5?si=RTt4qWrySHS2GMpaON0RBQ",
    youtubeUrl: "https://music.youtube.com/channel/UC...",
    appleMusicUrl: "https://music.apple.com/artist/...",
  },
  {
    id: "rosella",
    name: "Rosella",
    image: "/laptop-uploads/Rosella.jpg",
    country: "Playas De Tijuana, México",
    genre: "Musica Medicina",
    bio: "From the borderlands of Tijuana, Rosella weaves ancient wisdom into modern Musica Medicina, bridging cultures through healing sound.",
    spotifyUrl: "https://open.spotify.com/artist/2tOG1hBhUrWO87AfSA4Ej6?si=W8l0jUgsQ9-TSxoPPWMWvA",
    youtubeUrl: "https://music.youtube.com/channel/UC...",
    appleMusicUrl: "https://music.apple.com/artist/...",
  },
  {
    id: "felicidad",
    name: "Felicidad",
    image: "/laptop-uploads/BlackJ.png",
    country: "Bogota, Colombia",
    genre: "Musica Medicina, R&B",
    bio: "Felicidad combines the soulful essence of R&B with the healing power of Musica Medicina, creating uplifting musical journeys.",
    spotifyUrl: "https://open.spotify.com/artist/5hKIALJCfhcnvPE6EJR4Jc",
    youtubeUrl: "https://music.youtube.com/channel/UC...",
    appleMusicUrl: "https://music.apple.com/artist/...",
  },
  {
    id: "christian-jones",
    name: "Christian Jones",
    image: "/laptop-uploads/RIVERSIDE.jpg",
    country: "California, USA",
    genre: "Rap, Soul",
    bio: "Christian Jones delivers authentic Rap and Soul from California, telling stories that resonate with raw emotion and spiritual depth.",
    spotifyUrl: "https://open.spotify.com/artist/5iypl9rruEx6nUMwgGfZCJ?si=MHgV5vGtTSKTdTq3UM6NMA",
    youtubeUrl: "https://music.youtube.com/channel/UC...",
    appleMusicUrl: "https://music.apple.com/artist/...",
  },
];

const Artist = () => {
  const { id } = useParams();
  const artist = artists.find(a => a.id === id);

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 text-white flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg p-8 rounded-3xl">
          <h1 className="text-2xl font-bold mb-4">Artist not found</h1>
          <Link to="/" className="text-white/80 hover:text-white underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-32 w-48 h-48 bg-white rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full blur-lg"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-all duration-300 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20"
          >
            <ArrowLeft size={20} />
            Back to Artists
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 rounded-3xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
              <img
                src={artist.image}
                alt={artist.name}
                className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute -bottom-4 -right-4 bg-white/20 backdrop-blur-sm p-3 rounded-full">
                <Music size={24} className="text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white bg-gradient-to-r from-white to-white/80 bg-clip-text">
                {artist.name}
              </h1>
              <div className="flex items-center gap-2 text-white/90 text-xl mb-2">
                <MapPin size={20} />
                {artist.country}
              </div>
              <p className="text-white/70 text-lg">{artist.genre}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl"
            >
              <h2 className="text-3xl font-bold mb-4 text-white">About</h2>
              <p className="text-white/90 leading-relaxed text-lg">{artist.bio}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl"
            >
              <h2 className="text-3xl font-bold mb-6 text-white">Listen On</h2>
              <div className="space-y-4">
                <motion.a
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="bg-white/20 p-2 rounded-full">
                    <Music size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-white text-lg flex-1">Spotify</span>
                  <ExternalLink size={20} className="text-white" />
                </motion.a>

                <motion.a
                  href={artist.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 p-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="bg-white/20 p-2 rounded-full">
                    <Music size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-white text-lg flex-1">YouTube Music</span>
                  <ExternalLink size={20} className="text-white" />
                </motion.a>

                <motion.a
                  href={artist.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 p-5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="bg-white/20 p-2 rounded-full">
                    <Music size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-white text-lg flex-1">Apple Music</span>
                  <ExternalLink size={20} className="text-white" />
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Artist;
