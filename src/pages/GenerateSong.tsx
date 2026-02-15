import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ChevronDown, HardDrive, Link, X, Loader2, Info, Check, Circle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";



// Google Drive link type
interface DriveLink {
  url: string;
  name: string;
}

const genreCategories = [
  { value: "hip-hop", label: "Hip Hop / Trap / Rap" },
  { value: "rnb", label: "R&B / Soul" },
  { value: "reggae", label: "Reggae / Dancehall" },
  { value: "latin", label: "Latin / Reggaeton" },
  { value: "electronic", label: "Electronic / EDM" },
  { value: "pop", label: "Pop / Alternative" },
  { value: "rock", label: "Rock / Indie" },
  { value: "world", label: "World / Indigenous / Medicina" },
  { value: "other", label: "Other / Mixed" },
];
const tiers = [
  { label: "$0", price: 0, description: "Free AI Generated - for comparison", priceId: null, info: "Get a quick AI-generated demo using Google Lyria 2. Great for testing ideas before committing. Limited to 3 per 5 hours." },
  { label: "$25", price: 25, description: "Demo Project - for ideas (30sec)", priceId: "price_1SHdNFQchHjxRXODM3DJdjEE", info: "A human-produced 30-second demo by one of our producers. Perfect for pitch decks, social media teasers, or validating a concept before full production." },
  { label: "$125", price: 125, description: "Artist-grade quality - for production (180sec)", priceId: "price_1SHdNVQchHjxRXODn3lW4vDj", info: "A full 3-minute production-ready track. Includes professional arrangement, sound design, and high-quality mix. Ideal for singles, EPs, or album tracks." },
  { label: "$250", price: 250, description: "Industry standard - for masterpiece (300sec)", priceId: "price_1SHdNmQchHjxRXODgqWhW9TO", info: "A premium 5-minute track with top-tier production, detailed arrangement, and radio-ready quality. Includes priority producer matching and faster turnaround." }
];

// Add-on pricing per tier (tier index: 0=free, 1=$25, 2=$125, 3=$250)
const addOnPricing = {
  stems: { prices: [0, 10, 25, 40], info: "Receive individual instrument/vocal tracks (stems) so you can remix, rearrange, or use them in your own DAW." },
  analog: { prices: [0, 15, 35, 50], info: "Your track will be processed through real analog hardware (compressors, EQs, tape machines) for warmer, richer sound character." },
  mixing: { prices: [0, 20, 50, 75], info: "Professional mixing by our engineer: balancing levels, EQ, compression, effects, and spatial positioning for a polished sound." },
  mastering: { prices: [0, 15, 40, 60], info: "Final mastering to optimize loudness, clarity, and consistency across all playback systems. Industry-standard LUFS targeting." },
  revision: { prices: [0, 5, 15, 25], info: "Each revision allows you to request specific changes to your track. The producer will adjust based on your feedback notes." },
};

const MAX_FREE_AI_SONGS = 3;
const RESET_HOURS = 5;

const GenerateSong = () => {
  const [sliderValue, setSliderValue] = useState([0]);
  const [idea, setIdea] = useState("");
  
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>([]);
  const [showDriveLinkInput, setShowDriveLinkInput] = useState(false);
  const [newDriveLink, setNewDriveLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [numberOfRevisions, setNumberOfRevisions] = useState(0);
  const [wantsRecordedStems, setWantsRecordedStems] = useState(false);
  const [wantsAnalog, setWantsAnalog] = useState(false);
  const [wantsMixing, setWantsMixing] = useState(false);
  const [wantsMastering, setWantsMastering] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiProgress, setAiProgress] = useState("");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [aiGenerationsRemaining, setAiGenerationsRemaining] = useState<number | null>(null);
  const [nextResetTime, setNextResetTime] = useState<Date | null>(null);
  const [countdownDisplay, setCountdownDisplay] = useState<string>("");
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentTier = tiers[sliderValue[0]];
  const tierIndex = sliderValue[0];


  // Calculate total price with add-ons
  const calculateTotalPrice = () => {
    if (tierIndex === 0) return 0;
    
    let total = currentTier.price;
    
    if (wantsRecordedStems) total += addOnPricing.stems.prices[tierIndex];
    if (wantsAnalog) total += addOnPricing.analog.prices[tierIndex];
    if (wantsMixing) total += addOnPricing.mixing.prices[tierIndex];
    if (wantsMastering) total += addOnPricing.mastering.prices[tierIndex];
    total += numberOfRevisions * addOnPricing.revision.prices[tierIndex];
    
    return total;
  };

  const totalPrice = calculateTotalPrice();

  // Check AI generation limits
  const checkAIGenerationLimits = async () => {
    if (!user) {
      setAiGenerationsRemaining(MAX_FREE_AI_SONGS);
      return;
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - RESET_HOURS);

    const { data, error } = await supabase
      .from('ai_song_generations')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error checking AI limits:", error);
      return;
    }

    const usedCount = data?.length || 0;
    setAiGenerationsRemaining(Math.max(0, MAX_FREE_AI_SONGS - usedCount));

    // Calculate next reset time based on oldest generation in window
    if (data && data.length > 0) {
      const oldestGeneration = new Date(data[0].created_at);
      const nextReset = new Date(oldestGeneration.getTime() + RESET_HOURS * 60 * 60 * 1000);
      setNextResetTime(nextReset);
    } else {
      setNextResetTime(null);
    }
  };

  useEffect(() => {
    checkAIGenerationLimits();
  }, [user]);

  // Live countdown timer for generation reset
  useEffect(() => {
    if (!nextResetTime) {
      setCountdownDisplay("");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = nextResetTime.getTime() - now;
      
      if (diff <= 0) {
        setCountdownDisplay("");
        checkAIGenerationLimits(); // Refresh limits when timer expires
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdownDisplay(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdownDisplay(`${minutes}m ${seconds}s`);
      } else {
        setCountdownDisplay(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextResetTime]);

  // Check if returning from auth with pending request
  useEffect(() => {
    const pendingRequest = localStorage.getItem('pendingSongRequest');
    if (pendingRequest && user) {
      const { idea: savedIdea, tier: savedTier } = JSON.parse(pendingRequest);
      setIdea(savedIdea);
      setSliderValue([savedTier]);
      
      localStorage.removeItem('pendingSongRequest');
      toast({
        title: "Welcome back!",
        description: "You can now submit your song request.",
      });
    }
  }, [user, toast]);

  // Handle adding Google Drive links
  const handleAddDriveLink = () => {
    if (!newDriveLink.trim()) {
      toast({
        title: "No link provided",
        description: "Please enter a Google Drive, Dropbox, or other file sharing link",
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(newDriveLink);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    // Extract name from URL or use generic
    let name = "Shared file";
    if (newDriveLink.includes("drive.google.com")) {
      name = "Google Drive file";
    } else if (newDriveLink.includes("dropbox.com")) {
      name = "Dropbox file";
    } else if (newDriveLink.includes("wetransfer.com")) {
      name = "WeTransfer file";
    } else if (newDriveLink.includes("onedrive")) {
      name = "OneDrive file";
    }

    setDriveLinks(prev => [...prev, { url: newDriveLink.trim(), name }]);
    setNewDriveLink("");
    setShowDriveLinkInput(false);
    
    toast({
      title: "Link added",
      description: "Your file link has been added to the submission",
    });
  };

  const removeDriveLink = (index: number) => {
    setDriveLinks(prev => prev.filter((_, i) => i !== index));
  };
  // Handle AI generation separately from paid tier submission
  const handleGenerateAI = async () => {
    if (!idea) {
      toast({
        title: "Missing information",
        description: "Please share your idea",
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated for AI generation
    if (!user) {
      localStorage.setItem('pendingSongRequest', JSON.stringify({
        idea,
        tier: 0
      }));
      toast({
        title: "Authentication required",
        description: "Please sign in to generate AI songs.",
      });
      navigate("/auth");
      return;
    }

    // Check limits
    if (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0) {
      const timeUntilReset = nextResetTime ? 
        Math.ceil((nextResetTime.getTime() - Date.now()) / (1000 * 60 * 60)) : RESET_HOURS;
      toast({
        title: "Daily limit reached",
        description: `You've used all ${MAX_FREE_AI_SONGS} free AI generations. Try again in ${timeUntilReset} hours or choose a paid tier.`,
        variant: "destructive",
        duration: 8000
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiProgress("Connecting to Google Lyria 2...");

    try {
      const genreText = selectedGenre ? genreCategories.find(g => g.value === selectedGenre)?.label || selectedGenre : "";
      const fullPrompt = genreText ? `${genreText} style: ${idea}` : idea;
      
      setAiProgress("Generating your AI music... This may take a moment.");
      
      const { data, error } = await supabase.functions.invoke('generate-music', {
        body: { prompt: fullPrompt }
      });

      if (error) {
        console.error("AI generation error:", error);
        throw new Error(error.message || "Failed to generate music");
      }

      if (data?.error) {
        if (data.errorType === "CONTENT_FILTER") {
          toast({
            title: "Prompt needs adjustment",
            description: data.error,
            variant: "destructive",
            duration: 8000
          });
          setAiProgress("");
          setIsGeneratingAI(false);
          return;
        }
        throw new Error(data.error);
      }

      if (data?.output) {
        // Record this generation count (no prompt stored for privacy)
        const { error: insertError } = await supabase
          .from('ai_song_generations')
          .insert({
            user_id: user.id,
            prompt: 'free_tier_generation', // Placeholder - no actual prompt stored
            genre: selectedGenre || null
          });

        if (insertError) {
          console.error("Failed to record AI generation:", insertError);
        }

        // Refresh the limits
        await checkAIGenerationLimits();

        // Convert base64 audio to blob URL
        const audioData = data.output;
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        
        setGeneratedAudioUrl(audioUrl);
        setAiProgress("");
        toast({
          title: "🎵 Music Generated!",
          description: `Your AI-generated track is ready. ${aiGenerationsRemaining !== null ? `${aiGenerationsRemaining - 1} generations remaining today.` : ''}`,
        });
      } else {
        throw new Error("No audio data received from AI");
      }
    } catch (aiError) {
      console.error("AI generation failed:", aiError);
      setAiProgress("");
      toast({
        title: "AI Generation Failed",
        description: aiError instanceof Error ? aiError.message : "Please try again with a more abstract description of the music you want.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For free tier, this button shouldn't do anything - use handleGenerateAI instead
    if (currentTier.price === 0) {
      return;
    }
    
    if (!idea) {
      toast({
        title: "Missing information",
        description: "Please share your idea",
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      // Save form state (excluding files) and redirect to auth
      localStorage.setItem('pendingSongRequest', JSON.stringify({
        idea,
        tier: sliderValue[0]
      }));
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your song request. Note: You'll need to re-upload any files after signing in.",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Collect drive links as file URLs
      const allFileUrls = driveLinks.map(link => link.url);

      // For paid tiers only - create song request and redirect to Stripe
      console.log("Creating paid tier song request...");
      const { data: requestData, error: insertError } = await supabase
        .from('song_requests')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          song_idea: idea,
          tier: currentTier.label,
          price: `$${totalPrice}`,
          status: 'pending_payment',
          file_urls: allFileUrls.length > 0 ? allFileUrls : null,
          number_of_revisions: numberOfRevisions,
          wants_recorded_stems: wantsRecordedStems,
          wants_analog: wantsAnalog,
          wants_mixing: wantsMixing,
          wants_mastering: wantsMastering,
          genre_category: selectedGenre || null
        })
        .select()
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw insertError;
      }

      console.log("Song request created:", requestData?.id);
      
      // Note: Producer assignment happens when a producer accepts via Discord
      // Discord notification is sent AFTER payment verification in verify-song-payment
      
      console.log("Initiating checkout...");

      const { data: sessionData, error } = await supabase.functions.invoke('create-song-checkout', {
        body: {
          tier: currentTier.label,
          idea,
          fileUrls: allFileUrls,
          requestId: requestData.id,
          totalPrice: totalPrice,
          basePrice: currentTier.price,
          addOns: {
            stems: wantsRecordedStems,
            analog: wantsAnalog,
            mixing: wantsMixing,
            mastering: wantsMastering,
            revisions: numberOfRevisions,
          }
        }
      });

      if (error) {
        console.error("Checkout error:", error);
        throw error;
      }
      
      if (sessionData?.url) {
        console.log("Redirecting to checkout...");
        window.location.href = sessionData.url;
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate smooth gradient colors based on slider position
  const getGradientColors = () => {
    const position = sliderValue[0];
    const colors = [{
      start: "hsl(280, 70%, 40%)",
      end: "hsl(220, 70%, 50%)"
    },
    // Purple-blue (Free)
    {
      start: "hsl(320, 70%, 50%)",
      end: "hsl(280, 70%, 60%)"
    },
    // Magenta-purple (Demo)
    {
      start: "hsl(0, 70%, 50%)",
      end: "hsl(340, 70%, 50%)"
    },
    // Red (Artist)
    {
      start: "hsl(30, 80%, 50%)",
      end: "hsl(20, 80%, 50%)"
    } // Orange (Industry)
    ];
    return colors[position];
  };

  // Get slider color based on position
  const getSliderColor = () => {
    const position = sliderValue[0];
    const colors = ["linear-gradient(90deg, hsl(280, 70%, 50%), hsl(220, 70%, 50%))",
    // Purple-blue gradient (Free)
    "linear-gradient(90deg, hsl(320, 70%, 60%), hsl(280, 70%, 60%))",
    // Magenta-purple gradient (Demo)
    "linear-gradient(90deg, hsl(0, 70%, 60%), hsl(340, 70%, 60%))",
    // Red-pink gradient (Artist)
    "linear-gradient(90deg, hsl(30, 80%, 60%), hsl(20, 80%, 60%))" // Orange gradient (Industry)
    ];
    return colors[position];
  };
  return <motion.div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4" animate={{
    background: `linear-gradient(135deg, ${getGradientColors().start}, ${getGradientColors().end})`
  }} transition={{
    duration: 0.6,
    ease: "easeInOut"
  }}>
      <div className="absolute inset-0 bg-black/20" />
      
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6
    }} className="max-w-3xl w-full z-10">
        <div className="text-center mb-12">
          <div className="w-24 h-20 mx-auto">
            <img src="/laptop-uploads/HEA_White.png" alt="HechoEnAmerica Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">🎶Create Your Sound🎶</h1>
          <p className="text-2xl text-white/90 font-medium">
            LA MUSIC ES MEDICINA
          </p>
        </div>

        <motion.div layout className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 relative">
              <Label className="text-white text-lg font-semibold">
                Select Price
              </Label>
              <div className="relative">
                <Slider
                  value={sliderValue}
                  onValueChange={(value) => {
                    setSliderValue(value);
                    setShowTooltip(true);
                  }}
                  max={3}
                  step={1}
                  className="w-full [&_[role=slider]]:border-white :bg-[var(--slider-color)] cursor-pointer"
                  style={{
                    // @ts-ignore - Custom CSS variable
                    "--slider-color": getSliderColor()
                  } as React.CSSProperties}
                />
              </div>
              <div className="flex justify-between text-white/90 text-sm font-medium">
                {tiers.map(tier => <span key={tier.label}>{tier.label}</span>)}
              </div>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-white/90 text-sm mt-2 flex items-center gap-2"
                  >
                    <span>{currentTier.description}</span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button type="button" className="inline-flex">
                          <Info className="w-4 h-4 text-white/60 hover:text-white cursor-pointer" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72 text-sm">
                        <p className="font-semibold mb-1">{currentTier.label} — {currentTier.description}</p>
                        <p className="text-muted-foreground">{currentTier.info}</p>
                      </HoverCardContent>
                    </HoverCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-lg font-semibold">
                Genre / Style
              </Label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select your preferred genre" />
                </SelectTrigger>
                <SelectContent>
                  {genreCategories.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value}>
                      {genre.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-white/60 text-xs">
                {currentTier.price === 0 
                  ? "This style will guide the AI music generation"
                  : "We'll match you with a producer who specializes in this style"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea" className="text-white text-lg font-semibold">
                Song Idea
              </Label>
              <Textarea id="idea" value={idea} onChange={e => setIdea(e.target.value)} placeholder={currentTier.price > 0 ? "Better than AI. Made by human hehe.." : "Feel free to use AI audios for your liking"} className="bg-white/20 border-white/30 text-white placeholder:text-white/50 min-h-[120px]" required 
              />
              {currentTier.price === 0 && (
                <>
                  <p className="text-white/70 text-xs leading-relaxed">
                    💡 <span className="font-medium">Tip:</span> Be descriptive! Instead of "reggae music", try "upbeat reggae with offbeat guitar skanks, deep dub bass, one-drop drums, and melodica at 90 BPM". Include mood, instruments, and tempo for best results.
                  </p>
                  {/* Prompt requirements checklist for AI tier */}
                  <div className="bg-white/10 rounded-lg p-3 space-y-2 mt-2">
                    <p className="text-white/80 text-xs font-semibold">Prompt Requirements:</p>
                    <div className="space-y-1.5">
                      {[
                        { label: "Genre selected", met: !!selectedGenre },
                        { label: "At least 20 characters describing your idea", met: idea.trim().length >= 20 },
                        { label: "Mention mood or energy (e.g. chill, energetic, dark)", met: /\b(chill|energetic|dark|happy|sad|upbeat|mellow|aggressive|dreamy|epic|calm|relaxed|intense|groovy|funky|smooth|powerful|soft|hard|bright|warm|cold|melancholic|euphoric|nostalgic|ambient|lively|moody)\b/i.test(idea) },
                        { label: "Mention at least one instrument or sound", met: /\b(guitar|bass|drum|piano|synth|808|hi-hat|kick|snare|organ|flute|violin|trumpet|sax|percussion|keys|pad|arp|strings|brass|vocal|beat|melody|chord|loop|sample|clap|cymbal|bell|harp|cello|horn|timbale|conga|bongo|melodica|marimba|ukulele|banjo)\b/i.test(idea) },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {req.met ? (
                            <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-white/30 shrink-0" />
                          )}
                          <span className={`text-xs ${req.met ? 'text-green-300' : 'text-white/50'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {currentTier.price > 0 && (
                <div className="space-y-4 mt-4">
                  {/* Paid tier requirements */}
                  <div className="bg-white/10 rounded-lg p-3 space-y-2">
                    <p className="text-white/80 text-xs font-semibold">Submission Requirements:</p>
                    <div className="space-y-1.5">
                      {[
                        { label: "Genre selected", met: !!selectedGenre },
                        { label: "Describe your song idea (at least 20 characters)", met: idea.trim().length >= 20 },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {req.met ? (
                            <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-white/30 shrink-0" />
                          )}
                          <span className={`text-xs ${req.met ? 'text-green-300' : 'text-white/50'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Share files via link */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <HardDrive className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold">Share Your Files</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      Share references, stems, or inspiration via Google Drive, Dropbox, or WeTransfer links.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowDriveLinkInput(true)}
                    variant="outline"
                    className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Add Drive / Cloud Link
                  </Button>

                  {/* Drive link input */}
                  <AnimatePresence>
                    {showDriveLinkInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white/10 rounded-lg p-4 space-y-3"
                      >
                        <Label className="text-white text-sm font-medium">
                          Paste Google Drive, Dropbox, or WeTransfer link
                        </Label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={newDriveLink}
                            onChange={(e) => setNewDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 text-sm"
                          />
                          <Button
                            type="button"
                            onClick={handleAddDriveLink}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setShowDriveLinkInput(false);
                              setNewDriveLink("");
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-white/50 text-xs">
                          💡 Tip: Make sure your link is set to "Anyone with the link can view"
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Drive links list */}
                  {driveLinks.length > 0 && (
                    <div className="bg-white/10 rounded-lg p-4 space-y-3">
                      <span className="text-white font-medium text-sm">
                        Attached Links ({driveLinks.length})
                      </span>
                      <div className="space-y-2">
                        {driveLinks.map((link, index) => (
                          <div 
                            key={`link-${index}`}
                            className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Link className="w-4 h-4 text-green-400" />
                              <span className="text-white/90 text-sm truncate">{link.name}</span>
                              <span className="text-white/40 text-xs truncate max-w-[150px]">
                                {link.url}
                              </span>
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeDriveLink(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentTier.price > 0 && (
              <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen} className="space-y-2">
                <CollapsibleTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full justify-between bg-white/10 hover:bg-white/20 text-white p-4 rounded-lg"
                  >
                    <span className="text-lg font-semibold">Additional Options</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isOptionsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2">
                <div className="space-y-4 bg-white/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="stems" 
                        checked={wantsRecordedStems}
                        onCheckedChange={(checked) => setWantsRecordedStems(checked as boolean)}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                      />
                      <label
                        htmlFor="stems"
                        className="text-white text-sm font-medium leading-none cursor-pointer"
                      >
                        Provide recorded stems
                      </label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button type="button"><Info className="w-3.5 h-3.5 text-white/50 hover:text-white" /></button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 text-sm">
                          <p className="text-muted-foreground">{addOnPricing.stems.info}</p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.stems.prices[tierIndex]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="analog" 
                        checked={wantsAnalog}
                        onCheckedChange={(checked) => setWantsAnalog(checked as boolean)}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                      />
                      <label
                        htmlFor="analog"
                        className="text-white text-sm font-medium leading-none cursor-pointer"
                      >
                        Use analog equipment
                      </label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button type="button"><Info className="w-3.5 h-3.5 text-white/50 hover:text-white" /></button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 text-sm">
                          <p className="text-muted-foreground">{addOnPricing.analog.info}</p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.analog.prices[tierIndex]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="mixing" 
                        checked={wantsMixing}
                        onCheckedChange={(checked) => setWantsMixing(checked as boolean)}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                      />
                      <label
                        htmlFor="mixing"
                        className="text-white text-sm font-medium leading-none cursor-pointer"
                      >
                        Include mixing service
                      </label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button type="button"><Info className="w-3.5 h-3.5 text-white/50 hover:text-white" /></button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 text-sm">
                          <p className="text-muted-foreground">{addOnPricing.mixing.info}</p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.mixing.prices[tierIndex]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="mastering" 
                        checked={wantsMastering}
                        onCheckedChange={(checked) => setWantsMastering(checked as boolean)}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                      />
                      <label
                        htmlFor="mastering"
                        className="text-white text-sm font-medium leading-none cursor-pointer"
                      >
                        Include mastering service
                      </label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button type="button"><Info className="w-3.5 h-3.5 text-white/50 hover:text-white" /></button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 text-sm">
                          <p className="text-muted-foreground">{addOnPricing.mastering.info}</p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.mastering.prices[tierIndex]}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="revisions" className="text-white text-sm font-medium">
                          Number of revisions
                        </Label>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <button type="button"><Info className="w-3.5 h-3.5 text-white/50 hover:text-white" /></button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64 text-sm">
                            <p className="text-muted-foreground">{addOnPricing.revision.info}</p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <span className="text-white/80 text-sm font-medium">
                        +${numberOfRevisions * addOnPricing.revision.prices[tierIndex]} (${addOnPricing.revision.prices[tierIndex]}/each)
                      </span>
                    </div>
                    <Slider
                      id="revisions"
                      value={[numberOfRevisions]}
                      onValueChange={(value) => setNumberOfRevisions(value[0])}
                      max={5}
                      step={1}
                      className="[&_[role=slider]]:border-white/40 [&_[role=slider]]:bg-white/10 [&_[role=slider]]:backdrop-blur-sm [&>span:first-child]:bg-white/20 [&>span:first-child>span]:bg-white/40"
                    />
                    <div className="flex justify-between text-white/50 text-xs">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
              </Collapsible>
            )}

            {/* Real-time Total Price Display */}
            {currentTier.price > 0 && (
              <motion.div
                key={totalPrice}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30"
              >
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-sm font-medium opacity-80">Total Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">${totalPrice}</span>
                      {totalPrice > currentTier.price && (
                        <span className="text-sm opacity-70">
                          (Base ${currentTier.price} + ${totalPrice - currentTier.price} add-ons)
                        </span>
                      )}
                    </div>
                  </div>
                  {(wantsRecordedStems || wantsAnalog || wantsMixing || wantsMastering || numberOfRevisions > 0) && (
                    <div className="text-right text-white/70 text-xs space-y-0.5">
                      {wantsRecordedStems && <p>Stems +${addOnPricing.stems.prices[tierIndex]}</p>}
                      {wantsAnalog && <p>Analog +${addOnPricing.analog.prices[tierIndex]}</p>}
                      {wantsMixing && <p>Mixing +${addOnPricing.mixing.prices[tierIndex]}</p>}
                      {wantsMastering && <p>Mastering +${addOnPricing.mastering.prices[tierIndex]}</p>}
                      {numberOfRevisions > 0 && <p>{numberOfRevisions}x Revisions +${numberOfRevisions * addOnPricing.revision.prices[tierIndex]}</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <AnimatePresence>
              {(isGeneratingAI || generatedAudioUrl) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-white/20 rounded-lg p-4">
                    {isGeneratingAI && (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span className="text-white font-medium">{aiProgress}</span>
                      </div>
                    )}
                    
                    {generatedAudioUrl && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">🎵 Your AI-Generated Song</span>
                        </div>
                        <audio 
                          controls 
                          src={generatedAudioUrl} 
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <a 
                            href={generatedAudioUrl} 
                            download="ai-generated-song.mp3"
                            className="flex-1"
                          >
                            <Button variant="secondary" className="w-full">
                              Download MP3
                            </Button>
                          </a>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setGeneratedAudioUrl(null);
                              setAiProgress("");
                            }}
                            className="bg-white/20 text-white border-white/50 hover:bg-white/30 font-medium"
                          >
                            Generate New
                          </Button>
                        </div>
                        <p className="text-white/70 text-xs text-center">
                          Want a professional human-produced version? Select a paid tier above!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            
            {/* Separate buttons for AI generation vs paid submission */}
            {currentTier.price === 0 ? (
              <div className="space-y-2">
                {/* Generation counter and reset timer */}
                {aiGenerationsRemaining !== null && countdownDisplay && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-white/90">
                      <span className="text-sm">
                        {aiGenerationsRemaining > 0 
                          ? `🎵 ${aiGenerationsRemaining}/${MAX_FREE_AI_SONGS} generations left`
                          : `⏳ Next generation available in:`
                        }
                      </span>
                    </div>
                    <div className="text-white font-mono font-bold text-lg mt-1">
                      {countdownDisplay}
                    </div>
                    {aiGenerationsRemaining > 0 && (
                      <p className="text-white/60 text-xs mt-1">
                        +1 generation renews in {countdownDisplay}
                      </p>
                    )}
                  </div>
                )}
                <Button 
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0) || !selectedGenre || idea.trim().length < 20 || !/\b(chill|energetic|dark|happy|sad|upbeat|mellow|aggressive|dreamy|epic|calm|relaxed|intense|groovy|funky|smooth|powerful|soft|hard|bright|warm|cold|melancholic|euphoric|nostalgic|ambient|lively|moody)\b/i.test(idea) || !/\b(guitar|bass|drum|piano|synth|808|hi-hat|kick|snare|organ|flute|violin|trumpet|sax|percussion|keys|pad|arp|strings|brass|vocal|beat|melody|chord|loop|sample|clap|cymbal|bell|harp|cello|horn|timbale|conga|bongo|melodica|marimba|ukulele|banjo)\b/i.test(idea)} 
                  className="w-full bg-white/50 text-black hover:bg-white font-bold text-lg py-6 disabled:opacity-40 disabled:cursor-not-allowed" 
                  size="lg"
                >
                  {isGeneratingAI ? "Generating..." : `Generate Free AI Song${aiGenerationsRemaining !== null ? ` (${aiGenerationsRemaining}/${MAX_FREE_AI_SONGS} left)` : ''}`}
                </Button>
                {(!selectedGenre || idea.trim().length < 20 || !/\b(chill|energetic|dark|happy|sad|upbeat|mellow|aggressive|dreamy|epic|calm|relaxed|intense|groovy|funky|smooth|powerful|soft|hard|bright|warm|cold|melancholic|euphoric|nostalgic|ambient|lively|moody)\b/i.test(idea) || !/\b(guitar|bass|drum|piano|synth|808|hi-hat|kick|snare|organ|flute|violin|trumpet|sax|percussion|keys|pad|arp|strings|brass|vocal|beat|melody|chord|loop|sample|clap|cymbal|bell|harp|cello|horn|timbale|conga|bongo|melodica|marimba|ukulele|banjo)\b/i.test(idea)) && (
                  <p className="text-white/50 text-xs text-center">
                    Complete all prompt requirements above to enable generation
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-white">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Processing... Redirecting to payment</span>
                    </div>
                  </motion.div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedGenre || idea.trim().length < 20} 
                  className="w-full bg-white/50 text-black hover:bg-white font-bold text-lg py-6 disabled:opacity-40 disabled:cursor-not-allowed" 
                  size="lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </span>
                  ) : "Submit Your Song Idea"}
                </Button>
                {(!selectedGenre || idea.trim().length < 20) && (
                  <p className="text-white/50 text-xs text-center">
                    Complete all submission requirements above to continue
                  </p>
                )}
              </div>
            )}
          </form>
        </motion.div>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-white/80 hover:text-white hover:bg-transparent">
            Back to Home
          </Button>
        </div>
      </motion.div>
    </motion.div>;
};
export default GenerateSong;