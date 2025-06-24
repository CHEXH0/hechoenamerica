
import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artist not found</h1>
          <Link to="/" className="text-green-400 hover:text-green-300">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Artists
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={artist.image}
              alt={artist.name}
              className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{artist.name}</h1>
              <p className="text-green-400 text-lg">{artist.country}</p>
              <p className="text-gray-400">{artist.genre}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">About</h2>
              <p className="text-gray-300 leading-relaxed">{artist.bio}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Listen On</h2>
              <div className="space-y-3">
                <a
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors"
                >
                  <span className="font-semibold">Spotify</span>
                  <ExternalLink size={18} />
                </a>
                <a
                  href={artist.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-red-600 hover:bg-red-700 p-4 rounded-lg transition-colors"
                >
                  <span className="font-semibold">YouTube Music</span>
                  <ExternalLink size={18} />
                </a>
                <a
                  href={artist.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors"
                >
                  <span className="font-semibold">Apple Music</span>
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Artist;
