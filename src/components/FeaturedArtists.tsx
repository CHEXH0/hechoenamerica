
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music, ExternalLink } from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";

const artists = [
  {
    name: "CHEXHO",
    image: "/laptop-uploads/AlbumCover.png",
    country: "California, USA",
    genre: "Alternative R&B, Musica Medicina",
    platforms: {
      spotify: "https://open.spotify.com/artist/51oO373JL3YH8dvT6v94xg?si=EgGVOngeRTaejIWl3TYqkA",
      youtubeMusic: "https://music.youtube.com/channel/UCExample1",
      appleMusic: "https://music.apple.com/artist/example1"
    }
  },
  {
    name: "Jiesson Diaz Santiago",
    image: "/laptop-uploads/Jiesson.png",
    country: "Bogotá, Colombia",
    genre: "Musica Medicina",
    platforms: {
      spotify: "https://open.spotify.com/artist/5MpXNiUTlKk7WmwEYhnVaC?si=BOfW5qmwRFWNMhnjhOa0Fw",
      youtubeMusic: "https://music.youtube.com/channel/UCExample2",
      appleMusic: "https://music.apple.com/artist/example2"
    }
  },
  {
    name: "Nick Zinchenko",
    image: "/laptop-uploads/Zinchenko.png",
    country: "Luhansk, Ukraine",
    genre: "Hip Hop, Trap, R&B",
    platforms: {
      spotify: "https://open.spotify.com/artist/5MNMLU5i9pBJCNh9kEP9F5?si=RTt4qWrySHS2GMpaON0RBQ",
      youtubeMusic: "https://music.youtube.com/channel/UCExample3",
      appleMusic: "https://music.apple.com/artist/example3"
    }
  },
  {
    name: "Rosella",
    image: "/laptop-uploads/Rosella.jpg",
    country: "Playas De Tijuana, México",
    genre: "Musica Medicina",
    platforms: {
      spotify: "https://open.spotify.com/artist/2tOG1hBhUrWO87AfSA4Ej6?si=W8l0jUgsQ9-TSxoPPWMWvA",
      youtubeMusic: "https://music.youtube.com/channel/UCExample4",
      appleMusic: "https://music.apple.com/artist/example4"
    }
  },
  {
    name: "Felicidad",
    image: "/laptop-uploads/BlackJ.png",
    country: "Bogota, Colombia",
    genre: "Musica Medicina, R&B",
    platforms: {
      spotify: "https://open.spotify.com/artist/5hKIALJCfhcnvPE6EJR4Jc",
      youtubeMusic: "https://music.youtube.com/channel/UCExample5",
      appleMusic: "https://music.apple.com/artist/example5"
    }
  },
  {
    name: "Christian Jones",
    image: "/laptop-uploads/RIVERSIDE.jpg",
    country: "California, USA",
    genre: "Rap, Soul",
    platforms: {
      spotify: "https://open.spotify.com/artist/5iypl9rruEx6nUMwgGfZCJ?si=MHgV5vGtTSKTdTq3UM6NMA",
      youtubeMusic: "https://music.youtube.com/channel/UCExample6",
      appleMusic: "https://music.apple.com/artist/example6"
    }
  },
];

const ARTISTS_PER_PAGE = 4;

const FeaturedArtists = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(artists.length / ARTISTS_PER_PAGE);
  
  const handlePlatformClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  const indexOfLastArtist = currentPage * ARTISTS_PER_PAGE;
  const indexOfFirstArtist = indexOfLastArtist - ARTISTS_PER_PAGE;
  const currentArtists = artists.slice(indexOfFirstArtist, indexOfLastArtist);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("featured-artists")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="featured-artists" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          Featured Artists
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentArtists.map((artist, index) => (
            <motion.div
              key={artist.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
                <div className="relative">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
                    <Music size={16} className="text-white" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{artist.name}</h3>
                  <p className="text-sm text-gray-300 mb-1">{artist.country}</p>
                  <p className="text-sm text-gray-400 mb-4">{artist.genre}</p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handlePlatformClick(artist.platforms.spotify)}
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded transition-colors text-sm"
                    >
                      <Music size={16} />
                      Spotify
                      <ExternalLink size={14} />
                    </button>
                    
                    <button
                      onClick={() => handlePlatformClick(artist.platforms.youtubeMusic)}
                      className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded transition-colors text-sm"
                    >
                      <Music size={16} />
                      YouTube Music
                      <ExternalLink size={14} />
                    </button>
                    
                    <button
                      onClick={() => handlePlatformClick(artist.platforms.appleMusic)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded transition-colors text-sm"
                    >
                      <Music size={16} />
                      Apple Music
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="cursor-pointer text-white hover:text-green-400 transition-colors"
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`cursor-pointer ${
                        currentPage === i + 1 ? "bg-green-500 text-white" : "text-white hover:text-green-400"
                      } transition-colors`}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="cursor-pointer text-white hover:text-green-400 transition-colors"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FeaturedArtists;
