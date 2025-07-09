
import React from "react";
import Hero from "@/components/Hero";
import FeaturedArtists from "@/components/FeaturedArtists";
import AudioPlatforms from "@/components/AudioPlatforms";
import Services from "@/components/Services";
import Contact from "@/components/Contact";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Hero />
      <FeaturedArtists />
      <AudioPlatforms />
      <Services />
      <Contact />
    </div>
  );
};

export default Index;
