
import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ArtistHeader from "../components/ArtistHeader";
import ArtistImage from "../components/ArtistImage";
import ArtistInfo from "../components/ArtistInfo";
import ArtistBio from "../components/ArtistBio";
import ArtistPlatforms from "../components/ArtistPlatforms";

const artists = [
  {
    id: "chexho",
    name: "CHEXHO",
    image: "/laptop-uploads/AlbumCover.png",
    country: "California, USA",
    genre: "Alternative R&B, Musica Medicina",
    bio: "CHEXHO is an innovative artist blending Alternative R&B with Musica Medicina, creating transformative musical experiences that heal and inspire.",
    spotifyUrl: "https://open.spotify.com/artist/51oO373JL3YH8dvT6v94xg?si=EgGVOngeRTaejIWl3TYqkA",
    youtubeUrl: "https://music.youtube.com/channel/UC2YuThfYNq2UTfAQlRQhAhw?si=qHHq90xz8ZqsqJ1Y",
    appleMusicUrl: "https://music.apple.com/us/artist/chexho/1777084383",
  },
  {
    id: "jiesson-diaz-santiago",
    name: "Jiesson Diaz Santiago",
    image: "/laptop-uploads/Jiesson.png",
    country: "Bogotá, Colombia",
    genre: "Musica Medicina",
    bio: "Based in Bogotá, Jiesson Diaz Santiago crafts healing soundscapes through Musica Medicina, connecting listeners to their inner wisdom.",
    spotifyUrl: "https://open.spotify.com/artist/5MpXNiUTlKk7WmwEYhnVaC?si=BOfW5qmwRFWNMhnjhOa0Fw",
    youtubeUrl: "https://music.youtube.com/channel/UCOzvqhVCaqNDbY7jRzqHEgQ?si=rHzk0wOj-GJ3XABc",
    appleMusicUrl: "https://music.apple.com/us/artist/jiesson-d%C3%ADaz-santiago/1788694452",
  },
  {
    id: "nick-zinchenko",
    name: "Nick Zinchenko",
    image: "/laptop-uploads/Zinchenko.png",
    country: "Luhansk, Ukraine",
    genre: "Hip Hop, Trap, R&B",
    bio: "Nick Zinchenko brings authentic Eastern European energy to Hip Hop, Trap, and R&B, creating powerful narratives through his music.",
    spotifyUrl: "https://open.spotify.com/artist/5MNMLU5i9pBJCNh9kEP9F5?si=RTt4qWrySHS2GMpaON0RBQ",
    youtubeUrl: "https://music.youtube.com/channel/UCJbVDaqHZUbFT3Mw8kzt2Nw?si=gvwZ_8zP50I9fiOa",
    appleMusicUrl: "https://music.apple.com/us/artist/nick-zinchenko/1674389844",
  },
  {
    id: "rosella",
    name: "Rosella",
    image: "/laptop-uploads/Rossella.jpg",
    country: "Playas De Tijuana, México",
    genre: "Musica Medicina",
    bio: "From the borderlands of Tijuana, Rosella weaves ancient wisdom into modern Musica Medicina, bridging cultures through healing sound.",
    spotifyUrl: "https://open.spotify.com/artist/2tOG1hBhUrWO87AfSA4Ej6?si=W8l0jUgsQ9-TSxoPPWMWvA",
    youtubeUrl: "https://music.youtube.com/channel/UCp2CGsqQbrlRYfSXAgePoww?si=ftQRH1oo63VIlfhA",
    appleMusicUrl: "https://music.apple.com/us/artist/rossella/263293042",
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
    appleMusicUrl: "https://music.apple.com/us/artist/felicidad/189759832",
  },
  {
    id: "christian-jones",
    name: "Christian Jones",
    image: "/laptop-uploads/RIVERSIDE.jpg",
    country: "California, USA",
    genre: "Rap, Soul",
    bio: "Christian Jones delivers authentic Rap and Soul from California, telling stories that resonate with raw emotion and spiritual depth.",
    spotifyUrl: "https://open.spotify.com/artist/5iypl9rruEx6nUMwgGfZCJ?si=MHgV5vGtTSKTdTq3UM6NMA",
    youtubeUrl: "https://music.apple.com/us/artist/christian-jones/106152357",
    appleMusicUrl: "https://music.apple.com/us/artist/christian-jones/106152357",
  },
];

const Artist = () => {
  const { id } = useParams();
  const artist = artists.find(a => a.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 text-white flex items-center justify-center">
        <div className="text-center bg-black/30 backdrop-blur-lg p-8 rounded-3xl border border-white/10">
          <h1 className="text-2xl font-bold mb-4">Artist not found</h1>
          <Link to="/" className="text-white/80 hover:text-white underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-pink-500 relative overflow-hidden">
      {/* Black overtone layer */}
      <div className="absolute inset-0 bg-black/20 z-0"></div>
      
      {/* Background Pattern with black overtones */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-black rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-32 w-48 h-48 bg-black rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-black rounded-full blur-lg"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <ArtistHeader />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ArtistImage image={artist.image} name={artist.name} />

          <div className="space-y-8">
            <ArtistInfo 
              name={artist.name}
              country={artist.country}
              genre={artist.genre}
            />

            <ArtistBio bio={artist.bio} />

            <ArtistPlatforms
              spotifyUrl={artist.spotifyUrl}
              youtubeUrl={artist.youtubeUrl}
              appleMusicUrl={artist.appleMusicUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Artist;
