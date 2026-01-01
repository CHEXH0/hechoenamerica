import React from "react";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import FeaturedProducers from "@/components/FeaturedProducers";
import AudioPlatforms from "@/components/AudioPlatforms";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <Hero />
      <FeaturedProducers />
      <AudioPlatforms />
      <Services />
      <section className="py-20 bg-gradient-to-b from-black to-purple-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to Create Your Next Hit?
          </h2>
          <Button 
            onClick={() => navigate('/generate-song')}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-full"
          >
            Get Started
          </Button>
        </div>
      </section>
      
      {/* Google Drive Integration Section */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Seamless File Delivery
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            HEA is a production management platform that allows producers to seamlessly 
            upload project files directly to their personal Google Drive for secure 
            storage and organization. Your finished tracks and stems are delivered 
            straight to your cloud storage, making collaboration effortless.
          </p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
