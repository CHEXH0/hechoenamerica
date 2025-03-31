
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileAudio, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Sample audio files data - in a real app, this would come from a database or API
const audioFiles = [
  { 
    id: "001", 
    name: "Drum Kit - Latino Heat", 
    type: "WAV", 
    duration: "1:35", 
    price: "Free",
    category: "Drums"
  },
  { 
    id: "002", 
    name: "Bass Loops Collection", 
    type: "WAV", 
    duration: "2:20", 
    price: "$19.99",
    category: "Bass"
  },
  { 
    id: "003", 
    name: "Vocal Chops - Spanish Edition", 
    type: "WAV/MP3", 
    duration: "3:15", 
    price: "$14.99",
    category: "Vocals"
  },
  { 
    id: "004", 
    name: "Percussion Essentials", 
    type: "WAV", 
    duration: "1:45", 
    price: "Free",
    category: "Percussion"
  },
  { 
    id: "005", 
    name: "Reggaeton Beat Pack", 
    type: "WAV", 
    duration: "2:55", 
    price: "$24.99",
    category: "Beats"
  },
  { 
    id: "006", 
    name: "Latin Piano Samples", 
    type: "WAV/MIDI", 
    duration: "4:10", 
    price: "$12.99",
    category: "Keys"
  },
  { 
    id: "007", 
    name: "Urban FX Collection", 
    type: "WAV", 
    duration: "1:20", 
    price: "$9.99",
    category: "Effects"
  },
  { 
    id: "008", 
    name: "Analog Synth Pack", 
    type: "WAV", 
    duration: "3:30", 
    price: "Free",
    category: "Synths"
  },
];

const SamplePack = () => {
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
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-white">
            Audio Sample Collection
          </h1>
          <p className="text-xl text-center text-gray-100 max-w-3xl mx-auto">
            High-quality audio samples for your productions from HechoEnAmerica Studio
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700 shadow-xl"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700">
                <TableHead className="text-gray-100 font-medium">Name</TableHead>
                <TableHead className="text-gray-100 font-medium">Category</TableHead>
                <TableHead className="text-gray-100 font-medium">Format</TableHead>
                <TableHead className="text-gray-100 font-medium">Duration</TableHead>
                <TableHead className="text-gray-100 font-medium">Price</TableHead>
                <TableHead className="text-gray-100 font-medium text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audioFiles.map((file) => (
                <TableRow 
                  key={file.id}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <TableCell className="flex items-center gap-3 text-white">
                    <FileAudio className="h-5 w-5 text-studio-gold" />
                    <span>{file.name}</span>
                  </TableCell>
                  <TableCell className="text-white">{file.category}</TableCell>
                  <TableCell className="text-white">{file.type}</TableCell>
                  <TableCell className="text-white">{file.duration}</TableCell>
                  <TableCell className={file.price === "Free" ? "text-green-300 font-medium" : "text-white"}>
                    {file.price}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={file.price === "Free" ? "default" : "outline"}
                      className={file.price === "Free" ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-400 text-white hover:bg-gray-700"}
                    >
                      {file.price === "Free" ? "Download" : "Buy Now"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <h3 className="text-2xl font-medium mb-4 text-white">Need custom samples?</h3>
          <p className="mb-6 text-gray-100">Contact us for custom sample packs or production services</p>
          <Link 
            to="/" 
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity font-medium"
          >
            Get in Touch
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SamplePack;
