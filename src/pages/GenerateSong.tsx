import { useState, useRef, useEffect } from "react";
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
import { Upload, Plus, ChevronDown } from "lucide-react";
import FileDeleter from "@/components/FileDeleter";

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
  { label: "$0", price: 0, description: "Free AI Generated - for comparison", priceId: null },
  { label: "$25", price: 25, description: "Demo Project - for ideas (30sec)", priceId: "price_1SHdNFQchHjxRXODM3DJdjEE" },
  { label: "$125", price: 125, description: "Artist-grade quality - for production (180sec)", priceId: "price_1SHdNVQchHjxRXODn3lW4vDj" },
  { label: "$250", price: 250, description: "Industry standard - for masterpiece (300sec)", priceId: "price_1SHdNmQchHjxRXODgqWhW9TO" }
];

// Add-on pricing per tier (tier index: 0=free, 1=$25, 2=$125, 3=$250)
const addOnPricing = {
  stems: [0, 10, 25, 40],        // Recorded stems
  analog: [0, 15, 35, 50],       // Analog equipment
  mixing: [0, 20, 50, 75],       // Mixing service
  mastering: [0, 15, 40, 60],    // Mastering service
  revision: [0, 5, 15, 25],      // Per revision
};

const MAX_FREE_AI_SONGS = 3;
const RESET_HOURS = 24;

const GenerateSong = () => {
  const [sliderValue, setSliderValue] = useState([0]);
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentTier = tiers[sliderValue[0]];
  const tierIndex = sliderValue[0];

  // Calculate total price with add-ons
  const calculateTotalPrice = () => {
    if (tierIndex === 0) return 0;
    
    let total = currentTier.price;
    
    if (wantsRecordedStems) total += addOnPricing.stems[tierIndex];
    if (wantsAnalog) total += addOnPricing.analog[tierIndex];
    if (wantsMixing) total += addOnPricing.mixing[tierIndex];
    if (wantsMastering) total += addOnPricing.mastering[tierIndex];
    total += numberOfRevisions * addOnPricing.revision[tierIndex];
    
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    }
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
      // Upload files to storage if any
      let fileUrls: string[] = [];
      if (files && files.length > 0) {
        console.log(`Starting upload of ${files.length} files...`);
        toast({
          title: "Uploading files...",
          description: `Uploading ${files.length} file(s) to Supabase storage`,
        });

        for (const file of files) {
          const timestamp = Date.now();
          const fileName = `${user.id}/${timestamp}_${file.name}`;
          
          console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-assets')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          console.log(`File uploaded successfully: ${fileName}`);

          // Get signed URL (valid for 1 year)
          const { data: signedData, error: signError } = await supabase.storage
            .from('product-assets')
            .createSignedUrl(fileName, 31536000); // 1 year expiry

          if (signError || !signedData) {
            console.error("Signed URL error:", signError);
            throw new Error(`Failed to create download link for ${file.name}`);
          }
          
          console.log(`Created signed URL for: ${fileName}`);
          fileUrls.push(signedData.signedUrl);
        }
        
        console.log(`All files uploaded. Total URLs: ${fileUrls.length}`);
      }

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
          file_urls: fileUrls.length > 0 ? fileUrls : null,
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
      
      console.log("Initiating Stripe checkout...");

      const { data: sessionData, error } = await supabase.functions.invoke('create-song-checkout', {
        body: {
          tier: currentTier.label,
          idea,
          fileUrls: fileUrls,
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
        console.error("Stripe checkout error:", error);
        throw error;
      }
      
      if (sessionData?.url) {
        console.log("Redirecting to Stripe checkout...");
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
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">🎶Create Your Song🎶</h1>
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
                    className="text-white/90 text-sm mt-2"
                  >
                    {currentTier.description}
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
                <p className="text-white/70 text-xs leading-relaxed">
                  💡 <span className="font-medium">Tip:</span> Be descriptive! Instead of "reggae music", try "upbeat reggae with offbeat guitar skanks, deep dub bass, one-drop drums, and melodica at 90 BPM". Include mood, instruments, and tempo for best results.
                </p>
              )}
              {currentTier.price > 0 && (
                <>
                  <div onClick={() => fileInputRef.current?.click()} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-white/60 text-xs">
                      Audio (.mp3, .wav), Images (.jpg, .png, .heic, etc.), Archives (.zip, .rar)
                  </p>
                  <div className="space-y-2">
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      id="files" 
                      multiple 
                      accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,.wma,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg,.heic,.heif,.raw,.cr2,.nef,.arw,.dng,.pdf,.zip,.rar,.7z" 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                    {files && files.length > 0 && (
                      <div className="text-white/80 text-sm space-y-1">
                        <p className="font-medium">Selected files:</p>
                        <FileDeleter files={files} onDelete={(index) => setFiles(files.filter((_, i) => i !== index))} />
                      </div>
                    )}
                  </div>
                </>
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
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.stems[tierIndex]}
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
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.analog[tierIndex]}
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
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.mixing[tierIndex]}
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
                    </div>
                    <span className="text-white/80 text-sm font-medium">
                      +${addOnPricing.mastering[tierIndex]}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="revisions" className="text-white text-sm font-medium">
                        Number of revisions
                      </Label>
                      <span className="text-white/80 text-sm font-medium">
                        +${numberOfRevisions * addOnPricing.revision[tierIndex]} (${addOnPricing.revision[tierIndex]}/each)
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
                      {wantsRecordedStems && <p>Stems +${addOnPricing.stems[tierIndex]}</p>}
                      {wantsAnalog && <p>Analog +${addOnPricing.analog[tierIndex]}</p>}
                      {wantsMixing && <p>Mixing +${addOnPricing.mixing[tierIndex]}</p>}
                      {wantsMastering && <p>Mastering +${addOnPricing.mastering[tierIndex]}</p>}
                      {numberOfRevisions > 0 && <p>{numberOfRevisions}x Revisions +${numberOfRevisions * addOnPricing.revision[tierIndex]}</p>}
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
                  disabled={isGeneratingAI || (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0)} 
                  className="w-full bg-white/50 text-black hover:bg-white font-bold text-lg py-6" 
                  size="lg"
                >
                  {isGeneratingAI ? "Generating..." : `Generate Free AI Song${aiGenerationsRemaining !== null ? ` (${aiGenerationsRemaining}/${MAX_FREE_AI_SONGS} left)` : ''}`}
                </Button>
              </div>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-white/50 text-black hover:bg-white font-bold text-lg py-6" 
                size="lg"
              >
                {isSubmitting ? "Submitting..." : "Submit Your Song Idea"}
              </Button>
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