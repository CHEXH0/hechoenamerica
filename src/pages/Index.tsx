import React from "react";
import Hero from "@/components/Hero";
import FeaturedArtists from "@/components/FeaturedArtists";
import AudioPlatforms from "@/components/AudioPlatforms";
import Contact from "@/components/Contact";
import Shop from "@/components/Shop";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Hero />
      <FeaturedArtists />
      <AudioPlatforms />
      // Add the Shop component here
      <Contact />
    </div>
  );
};

export default Index;