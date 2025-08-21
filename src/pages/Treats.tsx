
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileAudio, Disc3, Candy } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Product data - in a real app, this would come from a database or API
const products = {
  samples: [
    { 
      id: "s001", 
      name: "Drum Kit - Latino Heat", 
      type: "WAV", 
      duration: "1:35", 
      price: "Free",
      description: "High-energy Latin percussion samples"
    },
    { 
      id: "s002", 
      name: "Bass Loops Collection", 
      type: "WAV", 
      duration: "2:20", 
      price: "$19.99",
      description: "Deep bass loops for urban production"
    },
    { 
      id: "s003", 
      name: "Vocal Chops - Spanish Edition", 
      type: "WAV/MP3", 
      duration: "3:15", 
      price: "$14.99",
      description: "Authentic Spanish vocal samples"
    },
    { 
      id: "s004", 
      name: "Reggaeton Beat Pack", 
      type: "WAV", 
      duration: "2:55", 
      price: "$24.99",
      description: "Complete reggaeton construction kits"
    },
  ],
  vsts: [
    {
      id: "v001",
      name: "HechoEnAmerica Piano VST",
      type: "VST3/VST",
      size: "2.1 GB",
      price: "$79.99",
      description: "Premium Latin piano sounds and textures"
    },
    {
      id: "v002", 
      name: "Tropical Synth Collection",
      type: "VST3/VST",
      size: "1.8 GB", 
      price: "$59.99",
      description: "Tropical and Caribbean synthesizer presets"
    },
    {
      id: "v003",
      name: "Urban Percussion VST",
      type: "VST3/VST", 
      size: "3.2 GB",
      price: "$89.99",
      description: "Authentic Latin percussion instruments"
    },
  ],
  candies: [
    {
      id: "c001",
      name: "Dulce de Leche Bonbons",
      type: "Sweet Treat",
      weight: "250g",
      price: "$12.99",
      description: "Handcrafted dulce de leche chocolates"
    },
    {
      id: "c002",
      name: "Mango Chili Gummies", 
      type: "Gummy Candy",
      weight: "200g",
      price: "$8.99",
      description: "Spicy-sweet mango flavored gummies"
    },
    {
      id: "c003",
      name: "Café Cubano Truffles",
      type: "Chocolate",
      weight: "300g", 
      price: "$16.99",
      description: "Rich coffee-infused chocolate truffles"
    },
    {
      id: "c004",
      name: "Tropical Mix Variety Pack",
      type: "Mixed Candy",
      weight: "500g",
      price: "$24.99", 
      description: "Assorted tropical flavored candies and chocolates"
    },
  ]
};

const Treats = () => {
  const renderProductCard = (product: any, icon: React.ReactNode) => (
    <Card key={product.id} className="bg-gray-800/50 border-studio-gold/30 hover:border-studio-gold transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-white text-lg">{product.name}</CardTitle>
        </div>
        <CardDescription className="text-gray-300">{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
            {product.type}
          </span>
          {product.duration && (
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              {product.duration}
            </span>
          )}
          {product.size && (
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              {product.size}
            </span>
          )}
          {product.weight && (
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              {product.weight}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className={`font-bold text-lg ${product.price === "Free" ? "text-green-400" : "text-studio-gold"}`}>
          {product.price}
        </span>
        <Button
          variant={product.price === "Free" ? "default" : "outline"}
          className={
            product.price === "Free" 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "border-studio-gold text-studio-gold hover:bg-studio-gold hover:text-black"
          }
        >
          {product.price === "Free" ? "Download" : "Buy Now"}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="flex items-center text-white hover:text-studio-gold transition-colors mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-studio-gold to-studio-red bg-clip-text text-transparent">
            HECHO EN AMÉRICA TREATS
          </h1>
          <p className="text-xl text-gray-100 max-w-4xl mx-auto">
            Premium samples, professional VST plugins, and artisanal candies - all crafted with Latin soul
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="samples" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-800 border border-gray-700">
              <TabsTrigger value="samples" className="data-[state=active]:bg-studio-gold data-[state=active]:text-black">
                <FileAudio className="h-4 w-4 mr-2" />
                Audio Samples
              </TabsTrigger>
              <TabsTrigger value="vsts" className="data-[state=active]:bg-studio-gold data-[state=active]:text-black">
                <Disc3 className="h-4 w-4 mr-2" />
                VST Plugins
              </TabsTrigger>
              <TabsTrigger value="candies" className="data-[state=active]:bg-studio-gold data-[state=active]:text-black">
                <Candy className="h-4 w-4 mr-2" />
                Sweet Treats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="samples" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-studio-gold mb-4">Audio Samples</h2>
                <p className="text-gray-300">High-quality samples for your next hit production</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.samples.map((product) => 
                  renderProductCard(product, <FileAudio className="h-5 w-5 text-studio-gold" />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="vsts" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-studio-gold mb-4">VST Plugins</h2>
                <p className="text-gray-300">Professional VST3 and VST instruments for your DAW</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.vsts.map((product) => 
                  renderProductCard(product, <Disc3 className="h-5 w-5 text-studio-gold" />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="candies" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-studio-gold mb-4">Sweet Treats</h2>
                <p className="text-gray-300">Artisanal candies inspired by Latin American flavors</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.candies.map((product) => 
                  renderProductCard(product, <Candy className="h-5 w-5 text-studio-gold" />)
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg p-8 border border-studio-gold/20"
        >
          <h3 className="text-3xl font-bold mb-4 text-studio-gold">Need Something Custom?</h3>
          <p className="mb-6 text-gray-100 text-lg">Contact HechoEnAmerica for custom samples, VST development, or special candy orders</p>
          <Link 
            to="/" 
            className="inline-block bg-gradient-to-r from-studio-gold to-studio-red text-black px-8 py-4 rounded-full hover:opacity-90 transition-opacity font-bold text-lg"
          >
            Get in Touch
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Treats;
