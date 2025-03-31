
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const artists = [
  {
    name: "CHEXHO",
    image: "/laptop-uploads/Chexho.png",
    country: "Riverside, California",
    genre: "Alternative R&B, Musica Medicina",
    spotifyUrl: "https://open.spotify.com/artist/24QuE7SlnMG7AC9w2TkaRW",
  },
  {
    name: "Jiesson Diaz Santiago",
    image: "/laptop-uploads/Jiesson.png",
    country: "Bogotá, Colombia",
    genre: "Musica Medicina",
    spotifyUrl: "https://open.spotify.com/artist/7zGi5ZjoDXLmP4hv14VkGU",
  },
  {
    name: "Nick Zinchenko",
    image: "/laptop-uploads/Zinchenko.png",
    country: "Luhansk, Ukraine",
    genre: "Hip Hop, Trap, R&B",
    spotifyUrl: "https://open.spotify.com/artist/1cWsS6Qwvc9RYxWG4ZqppG",
  },
  {
    name: "Rosella",
    image: "/laptop-uploads/Rosella.jpg",
    country: "Playas De Tijuana, México",
    genre: "Musica Medicina",
    spotifyUrl: "https://open.spotify.com/artist/3oF1nqmZVtmOI0Vcte7GUz",
  },
  {
    name: "BlackJ",
    image: "/laptop-uploads/BlackJ.png",
    country: "Los Angeles, California",
    genre: "Hip Hop, R&B",
    spotifyUrl: "https://open.spotify.com/artist/5hKIALJCfhcnvPE6EJR4Jc",
  },
  {
    name: "Luna Nova",
    image: "/placeholder.svg",
    country: "Mexico City, Mexico",
    genre: "Alternative, Indie",
    spotifyUrl: "https://open.spotify.com/artist/4YLtscXsxbVgi031ovDDdh",
  },
  {
    name: "Soul Collective",
    image: "/placeholder.svg",
    country: "Austin, Texas",
    genre: "Soul, Jazz Fusion",
    spotifyUrl: "https://open.spotify.com/artist/1WQBRuVKjTDxMPOlNljzGT",
  },
  {
    name: "Aria Rodriguez",
    image: "/placeholder.svg",
    country: "San Juan, Puerto Rico",
    genre: "Latin Pop, R&B",
    spotifyUrl: "https://open.spotify.com/artist/2FXDmKdUY0h3HWvQPf5chd",
  },
];

const ARTISTS_PER_PAGE = 4;

const FeaturedArtists = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(artists.length / ARTISTS_PER_PAGE);
  
  const handleArtistClick = (spotifyUrl: string) => {
    window.open(spotifyUrl, "_blank", "noopener,noreferrer");
  };
  
  const indexOfLastArtist = currentPage * ARTISTS_PER_PAGE;
  const indexOfFirstArtist = indexOfLastArtist - ARTISTS_PER_PAGE;
  const currentArtists = artists.slice(indexOfFirstArtist, indexOfLastArtist);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the top of the section for better UX
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
              whileHover={{ scale: 1.05 }}
              className="relative group cursor-pointer"
              onClick={() => handleArtistClick(artist.spotifyUrl)}
            >
              <div className="relative overflow-hidden rounded-lg aspect-square">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {artist.name}
                    <Music size={18} className="text-green-400" />
                  </h3>
                  <p className="text-sm text-gray-300">{artist.country}</p>
                  <p className="text-sm text-gray-300/50">{artist.genre}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Music size={16} className="text-white" />
              </div>
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
