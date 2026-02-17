import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ProducerHeader from "../components/ProducerHeader";
import ProducerImage from "../components/ProducerImage";
import ProducerInfo from "../components/ProducerInfo";
import ProducerBio from "../components/ProducerBio";
import ProducerPlatforms from "../components/ProducerPlatforms";
import { useTranslation } from "@/contexts/TranslationContext";
import { useProducer } from "@/hooks/useProducers";

const Producer = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: producer, isLoading } = useProducer(id!);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white flex items-center justify-center">
        <div className="text-center bg-black/30 backdrop-blur-lg p-8 rounded-3xl border border-purple-900/20">
          <div className="animate-pulse">Loading producer...</div>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white flex items-center justify-center">
        <div className="text-center bg-black/30 backdrop-blur-lg p-8 rounded-3xl border border-purple-900/20">
          <h1 className="text-2xl font-bold mb-4">{t.producer.notFound}</h1>
          <Link to="/" className="text-purple-400 hover:text-purple-300 underline">
            {t.producer.returnToHome}
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
        <ProducerHeader />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ProducerImage image={producer.image} name={producer.name} />

          <div className="space-y-8">
            <ProducerInfo 
              name={producer.name}
              country={producer.country}
              genre={producer.genre}
            />

            <ProducerBio bio={producer.bio} />

            <ProducerPlatforms
              spotifyUrl={producer.spotify_url}
              youtubeUrl={producer.youtube_url}
              appleMusicUrl={producer.apple_music_url}
              youtubeChannelUrl={producer.youtube_channel_url}
              instagramUrl={producer.instagram_url}
              websiteUrl={producer.website_url}
            />
          </div>
        </div>

        {/* Showcase Videos */}
        {(() => {
          const videos = [
            (producer as any).showcase_video_1,
            (producer as any).showcase_video_2,
            (producer as any).showcase_video_3,
          ].filter(Boolean);
          if (videos.length === 0) return null;
          return (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">{producer.name} in Action</h2>
              <div className={`grid gap-6 ${videos.length === 1 ? 'max-w-2xl mx-auto' : videos.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
                {videos.map((url: string, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-purple-900/30 bg-black/30 backdrop-blur-sm">
                    <video src={url} controls className="w-full aspect-video object-contain" />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Producer;
