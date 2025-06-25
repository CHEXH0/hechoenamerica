
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    id: "chexho",
    name: "CHEXHO",
    image: "/laptop-uploads/AlbumCover.png",
    country: "California, USA",
    genre: "Alternative R&B, Musica Medicina",
  },
  {
    id: "jiesson-diaz-santiago",
    name: "Jiesson Diaz Santiago",
    image: "/laptop-uploads/Jiesson.png",
    country: "Bogotá, Colombia",
    genre: "Musica Medicina",
  },
  {
    id: "nick-zinchenko",
    name: "Nick Zinchenko",
    image: "/laptop-uploads/Zinchenko.png",
    country: "Luhansk, Ukraine",
    genre: "Hip Hop, Trap, R&B",
  },
  {
    id: "rosella",
    name: "Rossella",
    image: "/laptop-uploads/Rossella.jpg",
    country: "Playas De Tijuana, México",
    genre: "Musica Medicina",
  },
  {
    id: "felicidad",
    name: "Felicidad",
    image: "/laptop-uploads/BlackJ.png",
    country: "Bogota, Colombia",
    genre: "Musica Medicina, R&B",
  },
  {
    id: "christian-jones",
    name: "Christian Jones",
    image: "/laptop-uploads/RIVERSIDE.jpg",
    country: "California, USA",
    genre: "Rap, Soul",
  },
];

const ARTISTS_PER_PAGE = 4;

const FeaturedArtists = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const totalPages = Math.ceil(artists.length / ARTISTS_PER_PAGE);
  
  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`);
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
              onClick={() => handleArtistClick(artist.id)}
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
