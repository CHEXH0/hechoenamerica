import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Plus } from "lucide-react";
import FileDeleter from "@/components/FileDeleter";
const tiers = [
  { label: "$0", price: 0, description: "Free AI Generated - for comparison", priceId: null },
  { label: "$25", price: 25, description: "Demo Project - for ideas (30sec)", priceId: "price_1SHdNFQchHjxRXODM3DJdjEE" },
  { label: "$125", price: 125, description: "Artist-grade quality - for production (180sec)", priceId: "price_1SHdNVQchHjxRXODn3lW4vDj" },
  { label: "$250", price: 250, description: "Industry standard - for masterpiece (300sec)", priceId: "price_1SHdNmQchHjxRXODgqWhW9TO" }
];

const GenerateSong = () => {
  const [sliderValue, setSliderValue] = useState([0]);
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentTier = tiers[sliderValue[0]];

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
        description: "Processing your song generation request...",
      });
      // Auto-submit the form after restoring state
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }, 1500);
    }
  }, [user, toast]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Save form state and redirect to auth
      localStorage.setItem('pendingSongRequest', JSON.stringify({
        idea,
        tier: sliderValue[0]
      }));
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For free tier, just send email
      if (currentTier.price === 0) {
        let fileInfo = "";
        if (files && files.length > 0) {
          fileInfo = "\n\nAttached Files:\n";
          for (let i = 0; i < files.length; i++) {
            fileInfo += `- ${files[i].name} (${(files[i].size / 1024 / 1024).toFixed(2)} MB)\n`;
          }
        }
        
        const { error } = await supabase.functions.invoke('send-contact-email', {
          body: {
            name: "Song Generation Request",
            email: user.email,
            subject: `Song Generation Request - Free AI Generated`,
            message: `Idea: Free\n\nIdea: ${idea}${fileInfo}`
          }
        });
        
        if (error) throw error;
        navigate("/purchase-confirmation");
      } else {
        // For paid tiers, create Stripe checkout session
        const { data: sessionData, error } = await supabase.functions.invoke('create-song-checkout', {
          body: {
            priceId: currentTier.priceId,
            tier: currentTier.label,
            idea
          }
        });

        if (error) throw error;
        
        if (sessionData?.url) {
          window.open(sessionData.url, '_blank');
          toast({
            title: "Redirecting to payment",
            description: "Complete your payment in the new tab",
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
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
              <Label htmlFor="idea" className="text-white text-lg font-semibold">
                Song Idea
              </Label>
              <Textarea id="idea" value={idea} onChange={e => setIdea(e.target.value)} placeholder="Better than AI. Made by human hehe.." className="bg-white/20 border-white/30 text-white placeholder:text-white/50 min-h-[120px]" required 
              />
              <div onClick={() => fileInputRef.current?.click()} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                <Plus className="w-3 h-3 text-white" />
              </div>
              <p className="text-white/60 text-xs">
                  Audio (.mp3, .wav), Images, or Folders
              </p>
              <div className="space-y-2">
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  id="files" 
                  multiple 
                  accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,.wma,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg,.pdf,.zip,.rar,.7z" 
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
            </div>

            

            <Button type="submit" disabled={isSubmitting} className="w-full bg-white/50 text-black hover:bg-white font-bold text-lg py-6" size="lg">
              {isSubmitting ? "Submitting..." : "Submit Your Song Idea"}
            </Button>
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