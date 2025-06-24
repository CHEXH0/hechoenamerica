
import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, ExternalLink, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const artists = [
  {
    id: "chexho",
    name: "CHEXHO",
    image: "/laptop-uploads/AlbumCover.png",
    country: "California, USA",
    genre: "Alternative R&B, Musica Medicina",
    bio: "CHEXHO is an innovative artist blending Alternative R&B with Musica Medicina, creating healing soundscapes from California.",
    platforms: {
      spotify: "https://open.spotify.com/artist/51oO373JL3YH8dvT6v94xg?si=EgGVOngeRTaejIWl3TYqkA",
      youtubeMusic: "https://music.youtube.com/channel/UCExample1",
      appleMusic: "https://music.apple.com/artist/example1"
    }
  },
  {
    id: "jiesson-diaz-santiago",
    name: "Jiesson Diaz Santiago",
    image: "/laptop-uploads/Jiesson.png",
    country: "Bogotá, Colombia",
    genre: "Musica Medicina",
    bio: "Jiesson Diaz Santiago brings the healing power of Musica Medicina from the heart of Colombia, creating transformative musical experiences.",
    platforms: {
      spotify: "https://open.spotify.com/artist/5MpXNiUTlKk7WmwEYhnVaC?si=BOfW5qmwRFWNMhnjhOa0Fw",
      youtubeMusic: "https://music.youtube.com/channel/UCExample2",
      appleMusic: "https://music.apple.com/artist/example2"
    }
  },
  {
    id: "nick-zinchenko",
    name: "Nick Zinchenko",
    image: "/laptop-uploads/Zinchenko.png",
    country: "Luhansk, Ukraine",
    genre: "Hip Hop, Trap, R&B",
    bio: "Nick Zinchenko delivers powerful Hip Hop, Trap, and R&B from Ukraine, bringing authentic street sounds with international appeal.",
    platforms: {
      spotify: "https://open.spotify.com/artist/5MNMLU5i9pBJCNh9kEP9F5?si=RTt4qWrySHS2GMpaON0RBQ",
      youtubeMusic: "https://music.youtube.com/channel/UCExample3",
      appleMusic: "https://music.apple.com/artist/example3"
    }
  },
  {
    id: "rosella",
    name: "Rosella",
    image: "/laptop-uploads/Rosella.jpg",
    country: "Playas De Tijuana, México",
    genre: "Musica Medicina",
    bio: "Rosella channels the spiritual essence of Musica Medicina from the beautiful coastal region of Tijuana, Mexico.",
    platforms: {
      spotify: "https://open.spotify.com/artist/2tOG1hBhUrWO87AfSA4Ej6?si=W8l0jUgsQ9-TSxoPPWMWvA",
      youtubeMusic: "https://music.youtube.com/channel/UCExample4",
      appleMusic: "https://music.apple.com/artist/example4"
    }
  },
  {
    id: "felicidad",
    name: "Felicidad",
    image: "/laptop-uploads/BlackJ.png",
    country: "Bogota, Colombia",
    genre: "Musica Medicina, R&B",
    bio: "Felicidad combines the healing power of Musica Medicina with smooth R&B vibes, creating uplifting music from Colombia.",
    platforms: {
      spotify: "https://open.spotify.com/artist/5hKIALJCfhcnvPE6EJR4Jc",
      youtubeMusic: "https://music.youtube.com/channel/UCExample5",
      appleMusic: "https://music.apple.com/artist/example5"
    }
  },
  {
    id: "christian-jones",
    name: "Christian Jones",
    image: "/laptop-uploads/RIVERSIDE.jpg",
    country: "California, USA",
    genre: "Rap, Soul",
    bio: "Christian Jones brings authentic Rap and Soul from California, delivering powerful messages through his music.",
    platforms: {
      spotify: "https://open.spotify.com/artist/5iypl9rruEx6nUMwgGfZCJ?si=MHgV5vGtTSKTdTq3UM6NMA",
      youtubeMusic: "https://music.youtube.com/channel/UCExample6",
      appleMusic: "https://music.apple.com/artist/example6"
    }
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

  const handlePlatformClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-8 transition-colors">
            <ArrowLeft size={20} />
            Back to Featured Artists
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
              />
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{artist.name}</h1>
              <p className="text-xl text-green-400 mb-2">{artist.country}</p>
              <p className="text-lg text-gray-300 mb-6">{artist.genre}</p>
              <p className="text-gray-300 mb-8 leading-relaxed">{artist.bio}</p>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Listen on:</h3>
                
                <button
                  onClick={() => handlePlatformClick(artist.platforms.spotify)}
                  className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  <Music size={20} />
                  Listen on Spotify
                  <ExternalLink size={18} />
                </button>
                
                <button
                  onClick={() => handlePlatformClick(artist.platforms.youtubeMusic)}
                  className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  <Music size={20} />
                  Listen on YouTube Music
                  <ExternalLink size={18} />
                </button>
                
                <button
                  onClick={() => handlePlatformClick(artist.platforms.appleMusic)}
                  className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  <Music size={20} />
                  Listen on Apple Music
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Artist;
