import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileAudio, Disc3, Candy, Play, Download, ShoppingCart, Bell, BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Waveform from "@/components/Waveform";

// Product data - in a real app, this would come from a database or API
const products = {
  samples: [{
    id: "s001",
    name: "Drum Kit - Latino Heat",
    type: "WAV",
    duration: "1:35",
    price: "Free",
    description: "High-energy Latin percussion samples",
    image: "/laptop-uploads/recording.jpg",
    showcase: "/laptop-uploads/ProTools.png"
  }, {
    id: "s002",
    name: "Bass Loops Collection",
    type: "WAV",
    duration: "2:20",
    price: "$19.99",
    description: "Deep bass loops for urban production",
    image: "/laptop-uploads/FLoops.png",
    showcase: "/laptop-uploads/Cubase.png"
  }, {
    id: "s003",
    name: "Vocal Chops - Spanish Edition",
    type: "WAV/MP3",
    duration: "3:15",
    price: "$14.99",
    description: "Authentic Spanish vocal samples",
    image: "/laptop-uploads/Star.png",
    showcase: "/laptop-uploads/mixing-mastering.jpg"
  }, {
    id: "s004",
    name: "Reggaeton Beat Pack",
    type: "WAV",
    duration: "2:55",
    price: "$24.99",
    description: "Complete reggaeton construction kits",
    image: "/laptop-uploads/Pill.png",
    showcase: "/laptop-uploads/ProTools.png"
  }],
  vsts: [{
    id: "v001",
    name: "HechoEnAmerica Piano VST",
    type: "VST3/VST",
    size: "2.1 GB",
    price: "$79.99",
    description: "Premium Latin piano sounds and textures",
    image: "/laptop-uploads/Cubase.png",
    showcase: "/laptop-uploads/mixing-mastering.jpg",
    hasComparison: true
  }, {
    id: "v002",
    name: "Tropical Synth Collection",
    type: "VST3/VST",
    size: "1.8 GB",
    price: "$59.99",
    description: "Tropical and Caribbean synthesizer presets",
    image: "/laptop-uploads/FLoops.png",
    showcase: "/laptop-uploads/ProTools.png",
    hasComparison: true
  }, {
    id: "v003",
    name: "Urban Percussion VST",
    type: "VST3/VST",
    size: "3.2 GB",
    price: "$89.99",
    description: "Authentic Latin percussion instruments",
    image: "/laptop-uploads/Donut.png",
    showcase: "/laptop-uploads/Cubase.png",
    hasComparison: false,
    isInstrument: true
  }, {
    id: "v004",
    name: "Reggaeton Bassline VST",
    type: "VST3/VST",
    size: "2.5 GB",
    price: "$69.99",
    description: "Deep reggaeton bass synthesizer",
    image: "/laptop-uploads/Star.png",
    showcase: "/laptop-uploads/ProTools.png",
    hasComparison: false,
    isInstrument: true
  }],
  candies: [{
    id: "c001",
    name: "Dulce de Leche Bonbons",
    type: "Sweet Treat",
    weight: "250g",
    price: "$12.99",
    description: "Handcrafted dulce de leche chocolates",
    image: "/laptop-uploads/Donut.png",
    showcase: "/laptop-uploads/Star.png"
  }, {
    id: "c002",
    name: "Mango Chili Gummies",
    type: "Gummy Candy",
    weight: "200g",
    price: "$8.99",
    description: "Spicy-sweet mango flavored gummies",
    image: "/laptop-uploads/Pill.png",
    showcase: "/laptop-uploads/Donut.png"
  }, {
    id: "c003",
    name: "Café Cubano Truffles",
    type: "Chocolate",
    weight: "300g",
    price: "$16.99",
    description: "Rich coffee-infused chocolate truffles",
    image: "/laptop-uploads/Star.png",
    showcase: "/laptop-uploads/Pill.png"
  }, {
    id: "c004",
    name: "Tropical Mix Variety Pack",
    type: "Mixed Candy",
    weight: "500g",
    price: "$24.99",
    description: "Assorted tropical flavored candies and chocolates",
    image: "/laptop-uploads/Donut.png",
    showcase: "/laptop-uploads/Star.png"
  }]
};
const Treats = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [playingWaveform, setPlayingWaveform] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{
    [key: string]: HTMLAudioElement;
  }>({});
  const [notifyStates, setNotifyStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Sample audio URLs (using placeholder audio for demo)
  const sampleAudioUrls: {
    [key: string]: string;
  } = {
    's001': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-spanish.mp3',
    's002': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-french.mp3',
    's003': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-italian.mp3',
    's004': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-german.mp3',
    'v001': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-portuguese.mp3',
    'v001-wet': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-portuguese.mp3',
    'v002': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-russian.mp3',
    'v002-wet': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-russian.mp3',
    'v003': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-chinese.mp3',
    'v004': 'https://www.soundjay.com/misc/sounds-of-google-translate/google-translate-korean.mp3'
  };

  // Initialize audio elements
  React.useEffect(() => {
    const newAudioElements: {
      [key: string]: HTMLAudioElement;
    } = {};
    Object.entries(sampleAudioUrls).forEach(([id, url]) => {
      const audio = new Audio();
      // Create a simple tone using Web Audio API as fallback
      const createTone = (frequency: number) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        return {
          oscillator,
          audioContext,
          gainNode
        };
      };

      // Fallback to generated tone if URL fails
      audio.addEventListener('error', () => {
        console.log(`Failed to load audio for ${id}, using generated tone`);
      });
      audio.preload = 'metadata';
      audio.src = url;
      newAudioElements[id] = audio;
    });
    setAudioElements(newAudioElements);

    // Cleanup function
    return () => {
      Object.values(newAudioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);
  const handlePlayWaveform = async (productId: string) => {
    try {
      const currentAudio = audioElements[productId];
      if (playingWaveform === productId) {
        // Stop current audio
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        setPlayingWaveform(null);
        return;
      }

      // Stop any currently playing audio
      if (playingWaveform && audioElements[playingWaveform]) {
        audioElements[playingWaveform].pause();
        audioElements[playingWaveform].currentTime = 0;
      }

      // Play new audio or create tone
      if (currentAudio) {
        try {
          await currentAudio.play();
          setPlayingWaveform(productId);

          // Auto-stop after the audio ends
          currentAudio.addEventListener('ended', () => {
            setPlayingWaveform(null);
          });
        } catch (error) {
          // Fallback to Web Audio API tone
          console.log('Using Web Audio API fallback for', productId);
          createAndPlayTone(productId);
        }
      } else {
        createAndPlayTone(productId);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      createAndPlayTone(productId);
    }
  };
  const createAndPlayTone = (productId: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different products
      const frequencies: {
        [key: string]: number;
      } = {
        's001': 440,
        // A4
        's002': 523,
        // C5
        's003': 659,
        // E5
        's004': 784,
        // G5
        'v001': 349,
        // F4 - dry
        'v001-wet': 415,
        // G#4 - with effect
        'v002': 392,
        // G4 - dry  
        'v002-wet': 466,
        // A#4 - with effect
        'v003': 494,
        // B4
        'v004': 330 // E4
      };
      oscillator.frequency.setValueAtTime(frequencies[productId] || 440, audioContext.currentTime);
      oscillator.type = 'sine';

      // Fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
      setPlayingWaveform(productId);

      // Auto-stop after 2 seconds
      setTimeout(() => {
        setPlayingWaveform(null);
      }, 2000);
    } catch (error) {
      console.error('Error creating tone:', error);
    }
  };
  const handleNotifyMe = (productId: string) => {
    setNotifyStates(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));

    // In a real app, this would send the email to a backend service
    if (!notifyStates[productId]) {
      console.log(`User subscribed to notifications for product: ${productId}`);
      // Show a toast or success message here
    } else {
      console.log(`User unsubscribed from notifications for product: ${productId}`);
    }
  };
  const renderProductCard = (product: any, icon: React.ReactNode, category: string) => <motion.div key={product.id} initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5,
    delay: 0.1
  }} onMouseEnter={() => setHoveredCard(product.id)} onMouseLeave={() => setHoveredCard(null)} className="group">
      <Card className="bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-red-900/20 border-purple-500/30 hover:border-pink-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/25 backdrop-blur-md overflow-hidden h-full">
        {/* Product showcase image */}
        <div className="relative h-48 overflow-hidden">
          <motion.img src={product.image} alt={product.name} className="w-full h-full object-cover" whileHover={{
          scale: 1.1
        }} transition={{
          duration: 0.3
        }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Floating showcase preview */}
          <motion.div className="absolute top-4 right-4 w-16 h-16 rounded-lg overflow-hidden border-2 border-pink-400/50" animate={{
          scale: hoveredCard === product.id ? 1.2 : 1,
          rotate: hoveredCard === product.id ? 5 : 0
        }} transition={{
          duration: 0.3
        }}>
            <img src={product.showcase} alt="Showcase" className="w-full h-full object-cover" />
          </motion.div>
          
          {/* Play/Pause button overlay */}
          {(category === 'samples' || category === 'vsts' && !product.isInstrument) && <motion.button onClick={() => handlePlayWaveform(product.id)} className={`absolute bottom-4 left-4 ${playingWaveform === product.id ? 'bg-red-500 hover:bg-red-400' : 'bg-pink-500 hover:bg-pink-400'} text-white p-3 rounded-full transition-colors duration-200 shadow-lg`} whileHover={{
          scale: 1.1
        }} whileTap={{
          scale: 0.95
        }} title={playingWaveform === product.id ? 'Stop audio' : 'Play preview'}>
              {playingWaveform === product.id ? <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} className="w-4 h-4 bg-white rounded-sm" /> : <Play className="h-4 w-4" />}
            </motion.button>}

          {/* VST Comparison buttons for first two VSTs */}
          {category === 'vsts' && product.hasComparison && <div className="absolute bottom-4 left-4 flex gap-2">
              <motion.button onClick={() => handlePlayWaveform(product.id)} className={`${playingWaveform === product.id ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-600 hover:bg-gray-500'} text-white px-3 py-2 rounded-full text-xs transition-colors duration-200 shadow-lg`} whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} title="Play dry signal (without VST)">
                Dry
              </motion.button>
              <motion.button onClick={() => handlePlayWaveform(`${product.id}-wet`)} className={`${playingWaveform === `${product.id}-wet` ? 'bg-red-500 hover:bg-red-400' : 'bg-pink-500 hover:bg-pink-400'} text-white px-3 py-2 rounded-full text-xs transition-colors duration-200 shadow-lg`} whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} title="Play wet signal (with VST effect)">
                Wet
              </motion.button>
            </div>}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-pink-400">
              {icon}
            </div>
            <CardTitle className="text-white text-lg group-hover:text-pink-300 transition-colors duration-300">
              {product.name}
            </CardTitle>
          </div>
          <CardDescription className="text-gray-300 leading-relaxed">
            {product.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Animated waveform for audio products */}
          {(category === 'samples' || category === 'vsts' && !product.isInstrument) && <motion.div className="bg-black/30 rounded-lg p-3 border border-purple-500/20 relative" animate={{
          borderColor: playingWaveform === product.id || playingWaveform === `${product.id}-wet` ? "rgba(236, 72, 153, 0.5)" : "rgba(168, 85, 247, 0.2)"
        }} transition={{
          duration: 0.3
        }}>
              <div className="relative">
                <Waveform />
                {(playingWaveform === product.id || playingWaveform === `${product.id}-wet`) && <motion.div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded" animate={{
              opacity: [0.3, 0.7, 0.3]
            }} transition={{
              duration: 0.8,
              repeat: Infinity
            }} />}
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-400">
                  {product.hasComparison ? 'Comparison Preview' : 'Preview'}
                </span>
                <span className={`${playingWaveform === product.id || playingWaveform === `${product.id}-wet` ? 'text-pink-400' : 'text-gray-500'} transition-colors duration-200`}>
                  {playingWaveform === product.id ? '● Playing (Dry)' : playingWaveform === `${product.id}-wet` ? '● Playing (Wet)' : '○ Ready'}
                </span>
              </div>
            </motion.div>}

          {/* VST Instrument showcase */}
          {category === 'vsts' && product.isInstrument && <motion.div className="bg-black/30 rounded-lg p-4 border border-purple-500/20" whileHover={{
          borderColor: "rgba(236, 72, 153, 0.4)"
        }} transition={{
          duration: 0.3
        }}>
              <div className="text-center">
                <motion.div className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-3" whileHover={{
              scale: 1.1,
              rotate: 5
            }} transition={{
              duration: 0.3
            }}>
                  <Disc3 className="h-8 w-8 text-pink-400" />
                </motion.div>
                <p className="text-gray-300 text-sm">VST Instrument Plugin</p>
                <p className="text-pink-400 text-xs mt-1">No audio preview - Full instrument suite</p>
              </div>
            </motion.div>}
          
          {/* Product tags */}
          <div className="flex flex-wrap gap-2">
            <motion.span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-400/30" whileHover={{
            scale: 1.05
          }}>
              {product.type}
            </motion.span>
            {product.duration && <motion.span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm border border-pink-400/30" whileHover={{
            scale: 1.05
          }}>
                {product.duration}
              </motion.span>}
            {product.size && <motion.span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm border border-red-400/30" whileHover={{
            scale: 1.05
          }}>
                {product.size}
              </motion.span>}
            {product.weight && <motion.span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm border border-yellow-400/30" whileHover={{
            scale: 1.05
          }}>
                {product.weight}
              </motion.span>}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4">
          <motion.span className={`font-bold text-xl ${product.price === "Free" ? "text-emerald-400" : "bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent"}`} whileHover={{
          scale: 1.1
        }}>
            {product.price}
          </motion.span>
          
          <div className="flex gap-2">
            {category === 'candies' ? <Button onClick={() => handleNotifyMe(product.id)} className={`${notifyStates[product.id] ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'} text-white border-0 hover-scale transition-all duration-300`} size="sm">
                {notifyStates[product.id] ? <>
                    <BellRing className="h-4 w-4 mr-2" />
                    Subscribed
                  </> : <>
                    <Bell className="h-4 w-4 mr-2" />
                    Notify Me
                  </>}
              </Button> : product.price === "Free" ? <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 hover-scale" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button> : <Button className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0 hover-scale" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now
              </Button>}
          </div>
        </CardFooter>
      </Card>
    </motion.div>;
  return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div className="absolute top-20 left-20 w-32 h-32 bg-pink-500 rounded-full blur-xl" animate={{
        x: [0, 30, 0],
        y: [0, -20, 0],
        scale: [1, 1.2, 1]
      }} transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute bottom-40 right-32 w-48 h-48 bg-purple-500 rounded-full blur-2xl" animate={{
        x: [0, -40, 0],
        y: [0, 30, 0],
        scale: [1, 0.8, 1]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2
      }} />
        <motion.div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-500 rounded-full blur-lg" animate={{
        rotate: [0, 360],
        scale: [1, 1.5, 1]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear"
      }} />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="flex items-center mb-8">
          <Link to="/" className="flex items-center text-white hover:text-pink-400 transition-colors mr-4 hover-scale">
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        <motion.div initial={{
        opacity: 0,
        y: -30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="mb-12 text-center">
          <motion.h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-red-400 bg-clip-text text-transparent" animate={{
          backgroundPosition: ["0%", "100%", "0%"]
        }} transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}>TREATS</motion.h1>
          <motion.p className="text-xl text-gray-100 max-w-4xl mx-auto leading-relaxed" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3,
          duration: 0.6
        }}>Premium samples, professional VST plugins, and sweets!</motion.p>
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4,
        duration: 0.6
      }}>
          <Tabs defaultValue="samples" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-12 bg-black/40 backdrop-blur-md border border-purple-500/30 p-2">
              <TabsTrigger value="samples" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 hover-scale">
                <FileAudio className="h-4 w-4 mr-2" />
                Audio Samples
              </TabsTrigger>
              <TabsTrigger value="vsts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300 hover-scale">
                <Disc3 className="h-4 w-4 mr-2" />
                VST Plugins
              </TabsTrigger>
              <TabsTrigger value="candies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300 hover-scale">
                <Candy className="h-4 w-4 mr-2" />
                Sweet Treats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="samples" className="space-y-8">
              <motion.div className="text-center mb-10" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5
            }}>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Audio Samples
                </h2>
                <p className="text-gray-300 text-lg">High-quality samples for your next hit production</p>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.samples.map(product => renderProductCard(product, <FileAudio className="h-6 w-6" />, 'samples'))}
              </div>
            </TabsContent>

            <TabsContent value="vsts" className="space-y-8">
              <motion.div className="text-center mb-10" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5
            }}>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent mb-4">
                  VST Plugins
                </h2>
                <p className="text-gray-300 text-lg">Professional VST3 and VST instruments for your DAW</p>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.vsts.map(product => renderProductCard(product, <Disc3 className="h-6 w-6" />, 'vsts'))}
              </div>
            </TabsContent>

            <TabsContent value="candies" className="space-y-8">
              <motion.div className="text-center mb-10" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5
            }}>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Sweet Treats
                </h2>
                <p className="text-gray-300 text-lg">Artisanal candies inspired by Latin American flavors</p>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.candies.map(product => renderProductCard(product, <Candy className="h-6 w-6" />, 'candies'))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
        
        <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.6,
        duration: 0.6
      }} className="mt-20">
          <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-red-900/30 backdrop-blur-md rounded-2xl p-12 border border-pink-500/20 text-center">
            <motion.h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent" whileHover={{
            scale: 1.05
          }} transition={{
            duration: 0.2
          }}>
              Need Something Custom?
            </motion.h3>
            <motion.p className="mb-8 text-gray-100 text-xl leading-relaxed max-w-2xl mx-auto" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.8,
            duration: 0.6
          }}>
              Contact HechoEnAmerica for custom samples, VST development, or special candy orders
            </motion.p>
            <Link to="/" className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 text-white px-12 py-4 rounded-full hover:shadow-2xl hover:shadow-pink-500/25 transition-all duration-300 font-bold text-xl hover-scale">
              Get in Touch
            </Link>
          </div>
        </motion.div>
      </div>
    </div>;
};
export default Treats;