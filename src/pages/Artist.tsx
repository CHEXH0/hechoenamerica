import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ArtistHeader from "../components/ArtistHeader";
import ArtistImage from "../components/ArtistImage";
import ArtistInfo from "../components/ArtistInfo";
import ArtistBio from "../components/ArtistBio";
import ArtistPlatforms from "../components/ArtistPlatforms";
import { useTranslation } from "@/contexts/TranslationContext";
import { useArtist } from "@/hooks/useArtists";

const Artist = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: artist, isLoading } = useArtist(id!);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white flex items-center justify-center">
        <div className="text-center bg-black/30 backdrop-blur-lg p-8 rounded-3xl border border-purple-900/20">
          <div className="animate-pulse">Loading artist...</div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white flex items-center justify-center">
        <div className="text-center bg-black/30 backdrop-blur-lg p-8 rounded-3xl border border-purple-900/20">
          <h1 className="text-2xl font-bold mb-4">{t.artist.notFound}</h1>
          <Link to="/" className="text-purple-400 hover:text-purple-300 underline">
            {t.artist.returnToHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden">
      {/* Dark Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-32 w-48 h-48 bg-purple-500 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-500 rounded-full blur-lg"></div>
      </div>

      {/* Dark overlay for extra undertones */}
      <div className="absolute inset-0 bg-black/40"></div>

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
              spotifyUrl={artist.spotify_url}
              youtubeUrl={artist.youtube_url}
              appleMusicUrl={artist.apple_music_url}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Artist;
