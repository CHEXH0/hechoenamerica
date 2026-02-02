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
import { Upload, Plus, ChevronDown, HardDrive, Link, X, FileAudio, FileImage, FileArchive, File, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import FileDeleter from "@/components/FileDeleter";

// File size limits
const MAX_FILE_SIZE_MB = 500; // 500MB per file
const MAX_TOTAL_SIZE_MB = 2000; // 2GB total
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

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
const RESET_HOURS = 5;

const GenerateSong = () => {
  const [sliderValue, setSliderValue] = useState([0]);
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>([]);
  const [showDriveLinkInput, setShowDriveLinkInput] = useState(false);
  const [newDriveLink, setNewDriveLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState<string>("");
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

  // Calculate total file size
  const getTotalFileSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma'].includes(ext || '')) {
      return <FileAudio className="w-4 h-4 text-purple-300" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'heic', 'heif'].includes(ext || '')) {
      return <FileImage className="w-4 h-4 text-blue-300" />;
    }
    if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-yellow-300" />;
    }
    return <File className="w-4 h-4 text-white/70" />;
  };

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
      const newFiles = Array.from(e.target.files);
      
      // Check individual file sizes
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE_BYTES);
      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: `Files must be under ${MAX_FILE_SIZE_MB}MB. Use Google Drive for larger files.`,
          variant: "destructive"
        });
        return;
      }
      
      // Check total size
      const currentTotal = getTotalFileSize();
      const newTotal = currentTotal + newFiles.reduce((sum, f) => sum + f.size, 0);
      if (newTotal > MAX_TOTAL_SIZE_BYTES) {
        toast({
          title: "Total size exceeded",
          description: `Total upload limit is ${MAX_TOTAL_SIZE_MB / 1000}GB. Use Google Drive for additional files.`,
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

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
    setUploadProgress(0);
    setCurrentUploadFile("");
    
    try {
      // Upload files to storage if any
      let fileUrls: string[] = [];
      if (files && files.length > 0) {
        console.log(`Starting upload of ${files.length} files...`);
        
        const totalFiles = files.length;
        let completedFiles = 0;
        let totalBytes = files.reduce((sum, f) => sum + f.size, 0);
        let uploadedBytes = 0;

        for (const file of files) {
          const timestamp = Date.now();
          const fileName = `${user.id}/${timestamp}_${file.name}`;
          
          setCurrentUploadFile(file.name);
          console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
          
          // Use XMLHttpRequest for progress tracking
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const supabaseUrl = "https://eapbuoqkhckqaswfjexv.supabase.co";
            const uploadUrl = `${supabaseUrl}/storage/v1/object/product-assets/${encodeURIComponent(fileName)}`;
            
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const fileProgress = event.loaded;
                const currentTotalProgress = uploadedBytes + fileProgress;
                const overallProgress = Math.round((currentTotalProgress / totalBytes) * 100);
                setUploadProgress(Math.min(overallProgress, 99));
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                uploadedBytes += file.size;
                completedFiles++;
                console.log(`File uploaded successfully: ${fileName}`);
                resolve();
              } else {
                try {
                  const errorResponse = JSON.parse(xhr.responseText);
                  reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                } catch {
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error(`Network error while uploading ${file.name}`));
            });
            
            xhr.open('POST', uploadUrl, true);
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.setRequestHeader('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGJ1b3FraGNrcWFzd2ZqZXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzM0NjMsImV4cCI6MjA3MTQ0OTQ2M30.oybb51fqUbvPklFND2ah5ko3PVUDRUIulSIojuPfoWE');
            xhr.setRequestHeader('x-upsert', 'false');
            xhr.send(file);
          });

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
        
        setUploadProgress(100);
        console.log(`All files uploaded. Total URLs: ${fileUrls.length}`);
      }

      // Combine file URLs with drive links
      const allFileUrls = [
        ...fileUrls,
        ...driveLinks.map(link => link.url)
      ];

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
      
      console.log("Initiating Stripe checkout...");

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
                <div className="space-y-4 mt-4">
                  {/* File size info banner */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold">Upload Your Files</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      Up to <span className="text-white font-medium">{MAX_FILE_SIZE_MB}MB</span> per file, 
                      <span className="text-white font-medium"> {MAX_TOTAL_SIZE_MB / 1000}GB</span> total. 
                      For larger files, use Google Drive or Dropbox links below.
                    </p>
                  </div>

                  {/* Upload buttons row */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDriveLinkInput(true)}
                      variant="outline"
                      className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                    >
                      <HardDrive className="w-4 h-4 mr-2" />
                      Add Drive Link
                    </Button>
                  </div>

                  <p className="text-white/50 text-xs text-center">
                    Audio (.mp3, .wav, .flac), Images (.jpg, .png, .heic), Archives (.zip, .rar), PDF
                  </p>

                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    id="files" 
                    multiple 
                    accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,.wma,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg,.heic,.heif,.raw,.cr2,.nef,.arw,.dng,.pdf,.zip,.rar,.7z" 
                    onChange={handleFileChange} 
                    className="hidden"
                  />

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

                  {/* Selected files list */}
                  {(files.length > 0 || driveLinks.length > 0) && (
                    <div className="bg-white/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">
                          Attached Files ({files.length + driveLinks.length})
                        </span>
                        {files.length > 0 && (
                          <span className="text-white/60 text-xs">
                            {formatFileSize(getTotalFileSize())} / {MAX_TOTAL_SIZE_MB / 1000}GB
                          </span>
                        )}
                      </div>
                      
                      {/* Local files */}
                      {files.length > 0 && (
                        <div className="space-y-2">
                          {files.map((file, index) => (
                            <div 
                              key={`file-${index}`}
                              className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(file.name)}
                                <span className="text-white/90 text-sm truncate">{file.name}</span>
                                <span className="text-white/40 text-xs shrink-0">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                type="button"
                                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Drive links */}
                      {driveLinks.length > 0 && (
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
                      )}
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
              <div className="space-y-3">
                {/* Upload Progress Bar */}
                <AnimatePresence>
                  {isSubmitting && files.length > 0 && uploadProgress < 100 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 space-y-3"
                    >
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">
                            Uploading{currentUploadFile ? `: ${currentUploadFile}` : '...'}
                          </span>
                        </div>
                        <span className="text-sm font-bold">{uploadProgress}%</span>
                      </div>
                      <Progress 
                        value={uploadProgress} 
                        className="h-3 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:via-emerald-500 [&>div]:to-teal-500 [&>div]:shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                      />
                      <p className="text-white/60 text-xs text-center">
                        Please don't close this page while uploading
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {isSubmitting && uploadProgress === 100 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-300">
                      <span className="text-sm font-medium">✓ Files uploaded! Redirecting to payment...</span>
                    </div>
                  </motion.div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-white/50 text-black hover:bg-white font-bold text-lg py-6" 
                  size="lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {files.length > 0 && uploadProgress < 100 
                        ? `Uploading... ${uploadProgress}%` 
                        : "Processing..."}
                    </span>
                  ) : "Submit Your Song Idea"}
                </Button>
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