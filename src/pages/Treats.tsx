import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileAudio, Disc3, Candy, Play, Download, ShoppingCart, Bell, BellRing, RefreshCw, Plus, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Waveform from "@/components/Waveform";

import { useProducts, type Product } from "@/hooks/useProducts";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAuth } from "@/contexts/AuthContext";
import { Cart } from "@/components/Cart";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";

// Generate audio URLs from Supabase storage for VST wet versions
const getWetAudioUrl = (productId: string) => {
  return `https://eapbuoqkhckqaswfjexv.supabase.co/storage/v1/object/public/audio-samples/${productId}-wet.mp3`;
};

// Frequency mapping for audio tones (moved outside component to prevent re-creation)
const frequencies: {
  [key: string]: number;
} = {
  's001': 440, // A4
  's002': 523, // C5
  's003': 659, // E5
  's004': 784, // G5
  'v001': 349, // F4 - dry
  'v001-wet': 415, // G#4 - with effect
  'v002': 392, // G4 - dry  
  'v002-wet': 466, // A#4 - with effect
  'v003': 494, // B4
  'v004': 330 // E4
};

const Treats = () => {
  const { data: allProducts, isLoading, error } = useProducts();
  const { user } = useAuth();
  const isAdmin = user?.email === 'hechoenamerica369@gmail.com';
  const { addItem, getItemCount } = useCart();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [playingWaveform, setPlayingWaveform] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{
    [key: string]: HTMLAudioElement;
  }>({});
  const [notificationEmails, setNotificationEmails] = useState<{
    [key: string]: string;
  }>({});
  const [subscribingStates, setSubscribingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [vstCurrentPage, setVstCurrentPage] = useState(1);
  const vstItemsPerPage = 6;
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Organize products by category
  const products = React.useMemo(() => {
    if (!allProducts) return { samples: [], vsts: [], candies: [], vstsPaginated: [] };
    
    const vsts = allProducts.filter(p => p.category === 'vsts');
    const startIndex = (vstCurrentPage - 1) * vstItemsPerPage;
    const vstsPaginated = vsts.slice(startIndex, startIndex + vstItemsPerPage);
    
    return {
      samples: allProducts.filter(p => p.category === 'samples'),
      vsts,
      candies: allProducts.filter(p => p.category === 'candies'),
      vstsPaginated
    };
  }, [allProducts, vstCurrentPage]);

  // Initialize audio elements - MUST be called before any conditional returns
  React.useEffect(() => {
    const newAudioElements: {
      [key: string]: HTMLAudioElement;
    } = {};
    
    // Initialize audio elements for all products with audio preview URLs
    if (allProducts) {
      allProducts.forEach(product => {
        if (product.audio_preview_url) {
          const audio = new Audio(product.audio_preview_url);
          audio.preload = 'metadata';
          newAudioElements[product.id] = audio;
        }
      });
    }
    
    setAudioElements(newAudioElements);

    // Cleanup function
    return () => {
      Object.values(newAudioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [allProducts]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-pink-950 flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-400 rounded-full"
        />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Products</h2>
          <p className="text-gray-300">Please try again later</p>
        </div>
      </div>
    );
  }

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

      // Use the predefined frequencies
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

  const handleNotifyMe = async (productId: string, productName: string) => {
    const email = notificationEmails[productId];
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSubscribingStates(prev => ({ ...prev, [productId]: true }));

    try {
      const { error } = await supabase
        .from('product_notifications')
        .insert([{
          email: email,
          product_id: productId,
          product_name: productName
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Subscribed",
            description: "You're already subscribed to notifications for this product.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Subscribed! 🔔",
          description: `You'll be notified about updates to ${productName}.`,
        });
        setNotificationEmails(prev => ({ ...prev, [productId]: '' }));
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    // Don't add candies to cart since they're notify-only
    if (product.category === 'candies') {
      toast({
        title: "Coming Soon",
        description: "This treat will be available soon. Use 'Notify Me' to get updates!",
        variant: "destructive",
      });
      return;
    }

    addItem(product);
    toast({
      title: "Added to Cart! 🛒",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = async (product: Product) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow buying candies
    if (product.category === 'candies') {
      toast({
        title: "Coming Soon",
        description: "This treat will be available soon. Use 'Notify Me' to get updates!",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          items: [{
            product_id: product.id,
            quantity: 1
          }]
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Opening Stripe checkout in a new tab...",
        });
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Please try again or sync products to Stripe first.",
        variant: "destructive",
      });
    }
  };

  const handleSyncToStripe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync products to Stripe.",
        variant: "destructive",
      });
      return;
    }

    setSyncingProducts(true);

    try {
      const { data, error } = await supabase.functions.invoke('sync-products-to-stripe');

      if (error) {
        throw error;
      }

      const results = data?.results || [];
      const successful = results.filter((r: any) => r.status === 'success').length;
      const errors = results.filter((r: any) => r.status === 'error').length;

      toast({
        title: "Sync Completed! ✅",
        description: `${successful} products synced successfully${errors > 0 ? `, ${errors} errors` : ''}.`,
      });
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync products to Stripe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingProducts(false);
    }
  };

  const renderProductCard = (product: Product, icon: React.ReactNode, category: string) => (
    <motion.div 
      key={product.id} 
      initial={{
        opacity: 0,
        y: 20
      }} 
      animate={{
        opacity: 1,
        y: 0
      }} 
      transition={{
        duration: 0.5,
        delay: 0.1
      }} 
      onMouseEnter={() => setHoveredCard(product.id)} 
      onMouseLeave={() => setHoveredCard(null)} 
      className="group"
    >
      <Card className="bg-gradient-to-br from-purple-900/100 via-pink-900/200 to-red-900/100 border-purple-500/60 hover:border-pink-400/70 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/25 backdrop-blur-md overflow-hidden h-full">
        {/* Product showcase image */}
        <div className="relative h-48 overflow-hidden">
          <motion.img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover" 
            whileHover={{
              scale: 1.1
            }} 
            transition={{
              duration: 0.3
            }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Floating showcase preview */}
          <motion.div 
            className="absolute top-4 right-4 w-16 h-16 rounded-lg overflow-hidden border-2 border-pink-400/50" 
            animate={{
              scale: hoveredCard === product.id ? 1.2 : 1,
              rotate: hoveredCard === product.id ? 5 : 0
            }} 
            transition={{
              duration: 0.3
            }}
          >
            <img src={product.showcase} alt="Showcase" className="w-full h-full object-cover" />
          </motion.div>
          
          {/* Play/Pause button overlay */}
          {product.audio_preview_url && 
            <motion.button 
              onClick={() => handlePlayWaveform(product.id)} 
              className={`absolute bottom-4 left-4 ${playingWaveform === product.id ? 'bg-red-500 hover:bg-red-400' : 'bg-pink-500 hover:bg-pink-400'} text-white p-3 rounded-full transition-colors duration-200 shadow-lg`} 
              whileHover={{
                scale: 1.1
              }} 
              whileTap={{
                scale: 0.95
              }} 
              title={playingWaveform === product.id ? 'Stop audio' : 'Play preview'}
            >
              {playingWaveform === product.id ? 
                <motion.div 
                  initial={{
                    scale: 0
                  }} 
                  animate={{
                    scale: 1
                  }} 
                  className="w-4 h-4 bg-white rounded-sm" 
                /> : 
                <Play className="h-4 w-4" />
              }
            </motion.button>
          }

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

          {/* VST Instrument showcase */}
          {category === 'vsts' && product.is_instrument && 
            <motion.div 
              className="bg-black/30 rounded-lg p-4 border border-purple-500/20" 
              whileHover={{
                borderColor: "rgba(236, 72, 153, 0.4)"
              }} 
              transition={{
                duration: 0.3
              }}
            >
              <div className="text-center">
                <motion.div 
                  className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-3" 
                  whileHover={{
                    scale: 1.1,
                    rotate: 5
                  }} 
                  transition={{
                    duration: 0.3
                  }}
                >
                  <Disc3 className="h-8 w-8 text-pink-400" />
                </motion.div>
                <p className="text-gray-300 text-sm">VST Instrument Plugin</p>
                <p className="text-pink-400 text-xs mt-1">No audio preview - Full instrument suite</p>
              </div>
            </motion.div>
          }
          
          {/* Product tags */}
          <div className="flex flex-wrap gap-2">
            <motion.span 
              className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-400/30" 
              whileHover={{
                scale: 1.05
              }}
            >
              {product.type}
            </motion.span>
            {product.duration && 
              <motion.span 
                className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm border border-pink-400/30" 
                whileHover={{
                  scale: 1.05
                }}
              >
                {product.duration}
              </motion.span>
            }
            {product.size && 
              <motion.span 
                className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-400/30" 
                whileHover={{
                  scale: 1.05
                }}
              >
                {product.size}
              </motion.span>
            }
            {product.weight && 
              <motion.span 
                className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-400/30" 
                whileHover={{
                  scale: 1.05
                }}
              >
                {product.weight}
              </motion.span>
            }
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          {/* Price and action buttons */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center">
              <motion.span 
                className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" 
                whileHover={{
                  scale: 1.05
                }}
              >
                {product.price}
              </motion.span>
              {category !== 'candies' && 
                <motion.div 
                  className="flex gap-2" 
                  whileHover={{
                    scale: 1.02
                  }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBuyNow(product)}
                    className="border-purple-400/50 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddToCart(product)}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white border-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </motion.div>
              }
              {category === 'candies' && 
                <motion.div 
                  className="space-y-2" 
                  whileHover={{
                    scale: 1.02
                  }}
                >
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter email for updates" 
                      value={notificationEmails[product.id] || ''} 
                      onChange={(e) => setNotificationEmails(prev => ({
                        ...prev,
                        [product.id]: e.target.value
                      }))} 
                      className="bg-black/50 border-purple-400/30 text-white placeholder:text-gray-400 text-sm" 
                    />
                    <Button 
                      onClick={() => handleNotifyMe(product.id, product.name)} 
                      disabled={subscribingStates[product.id]} 
                      size="sm" 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white border-0 whitespace-nowrap"
                    >
                      {subscribingStates[product.id] ? 
                        <motion.div 
                          animate={{
                            rotate: 360
                          }} 
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                          }} 
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" 
                        /> : 
                        <>
                          <Bell className="h-4 w-4 mr-1" />
                          Notify Me
                        </>
                      }
                    </Button>
                  </div>
                </motion.div>
              }
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 left-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1.2, 1, 1.2]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-2xl"
        animate={{
          rotate: [0, 360],
          scale: [0.8, 1.3, 0.8]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Header */}
      <motion.div 
        className="relative z-10 p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link 
          to="/" 
          className="inline-flex items-center text-pink-400 hover:text-pink-300 transition-colors duration-200 mb-8 group"
        >
          <motion.div
            whileHover={{ x: -5 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
          </motion.div>
          Back to Home
        </Link>

        {/* Sync to Stripe button and Cart button for authenticated users */}
        {user && (
          <motion.div
            className="mb-6 flex gap-4 items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {isAdmin && (
              <Button
                onClick={handleSyncToStripe}
                disabled={syncingProducts}
                variant="outline"
                className="border-purple-400/50 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400"
              >
                {syncingProducts ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {syncingProducts ? 'Syncing...' : 'Sync Products to Stripe'}
              </Button>
            )}


            <Button
              onClick={() => setCartOpen(true)}
              variant="outline"
              className="border-pink-400/50 text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 relative"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {getItemCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-1.5 py-0.5">
                  {getItemCount()}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}

        <div className="text-center mb-16">
          <motion.h1 
            className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-red-400 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            TREATS
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Discover our exclusive collection of audio samples, VST plugins, and more treats. 
            Each item is crafted with passion and precision to fuel your creative journey.
          </motion.p>
        </div>

        <motion.div 
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Tabs defaultValue="samples" className="space-y-12">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-md border border-purple-500/20">
              <TabsTrigger 
                value="samples" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-pink-400 text-gray-400 transition-all duration-300"
              >
                <FileAudio className="h-5 w-5 mr-2" />
                Audio Samples
              </TabsTrigger>
              <TabsTrigger 
                value="vsts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-red-500/20 data-[state=active]:text-purple-400 text-gray-400 transition-all duration-300"
              >
                <Disc3 className="h-5 w-5 mr-2" />
                VST Plugins
              </TabsTrigger>
              <TabsTrigger 
                value="candies" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-red-400 text-gray-400 transition-all duration-300"
              >
                <Candy className="h-5 w-5 mr-2" />
                Sweet Treats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="samples" className="space-y-8">
              <motion.div 
                className="text-center mb-10" 
                initial={{
                  opacity: 0,
                  y: 20
                }} 
                animate={{
                  opacity: 1,
                  y: 0
                }} 
                transition={{
                  duration: 0.5
                }}
              >
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
              <motion.div 
                className="text-center mb-10" 
                initial={{
                  opacity: 0,
                  y: 20
                }} 
                animate={{
                  opacity: 1,
                  y: 0
                }} 
                transition={{
                  duration: 0.5
                }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent mb-4">
                  VST Plugins
                </h2>
                <p className="text-gray-300 text-lg">Professional VST3 and VST instruments for your DAW</p>
                {products.vsts.length > vstItemsPerPage && (
                  <p className="text-gray-400 text-sm mt-2">
                    Showing {((vstCurrentPage - 1) * vstItemsPerPage) + 1}-{Math.min(vstCurrentPage * vstItemsPerPage, products.vsts.length)} of {products.vsts.length} plugins
                  </p>
                )}
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.vstsPaginated.map(product => renderProductCard(product, <Disc3 className="h-6 w-6" />, 'vsts'))}
              </div>
              
              {/* Pagination for VSTs */}
              {products.vsts.length > vstItemsPerPage && (
                <motion.div 
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Pagination>
                    <PaginationContent className="gap-2">
                      {vstCurrentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setVstCurrentPage(prev => prev - 1)}
                            className="cursor-pointer bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-800/40 hover:text-purple-200"
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: Math.ceil(products.vsts.length / vstItemsPerPage) }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setVstCurrentPage(page)}
                            isActive={vstCurrentPage === page}
                            className={`cursor-pointer ${
                              vstCurrentPage === page 
                                ? 'bg-gradient-to-r from-purple-500/20 to-red-500/20 border-purple-400 text-purple-300' 
                                : 'bg-black/30 border-purple-500/30 text-gray-400 hover:bg-purple-900/20 hover:text-purple-300'
                            }`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {vstCurrentPage < Math.ceil(products.vsts.length / vstItemsPerPage) && (
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setVstCurrentPage(prev => prev + 1)}
                            className="cursor-pointer bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-800/40 hover:text-purple-200"
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="candies" className="space-y-8">
              <motion.div 
                className="text-center mb-10" 
                initial={{
                  opacity: 0,
                  y: 20
                }} 
                animate={{
                  opacity: 1,
                  y: 0
                }} 
                transition={{
                  duration: 0.5
                }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Sweet Treats
                </h2>
                <p className="text-gray-300 text-lg">Artisanal candies inspired by Latin American flavors</p>
              </motion.div>
              
              {/* Coming Soon Section */}
              <motion.div 
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="relative mb-8"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-red-400/30">
                    <Candy className="h-16 w-16 text-red-400" />
                  </div>
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-full blur-xl"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                
                <motion.h3 
                  className="text-5xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Coming Soon!
                </motion.h3>
                
                <motion.p 
                  className="text-xl text-gray-300 text-center max-w-2xl leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  We're crafting something sweet and special! Our artisanal candy collection will feature 
                  exotic Latin American flavors that will tantalize your taste buds. Stay tuned for an 
                  unforgettable culinary experience.
                </motion.p>
                
                <motion.div
                  className="flex items-center gap-4 text-gray-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-6 h-6 border-2 border-red-400/30 border-t-red-400 rounded-full"
                  />
                  <span className="text-lg">Something delicious is brewing...</span>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
        
        <motion.div 
          initial={{
            opacity: 0,
            scale: 0.95
          }} 
          animate={{
            opacity: 1,
            scale: 1
          }} 
          transition={{
            duration: 0.6,
            delay: 0.8
          }} 
          className="mt-20 text-center"
        >
          <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-red-900/50 border-purple-500/40 backdrop-blur-md max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text mb-4">
                Need Something Custom? 🎵
              </CardTitle>
              <CardDescription className="text-gray-800 text-lg leading-relaxed">
                Looking for bespoke audio production, custom VST development, or something else? 
                We specialize in creating unique experiences tailored to your creative vision.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white border-0 px-8"
                    >
                      Get In Touch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-gradient-to-br from-background/95 via-background to-muted/20 backdrop-blur-xl border border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
                        Contact Information
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <motion.div 
                        className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <Phone className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Phone</p>
                          <a 
                            href="tel:+1234567890" 
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            +1 (234) 567-8900
                          </a>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                          <Mail className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Email</p>
                          <a 
                            href="mailto:contact@hechoenamarica.com" 
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            contact@hechoenamarica.com
                          </a>
                        </div>
                      </motion.div>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>

      {/* Cart Component */}
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default Treats;