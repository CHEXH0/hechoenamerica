import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const tiers = ["Free", "Demo", "Artist", "Industry"];

const tierDescriptions = {
  Free: "Get started with basic features",
  Demo: "Try out professional tools",
  Artist: "Full access to artist features",
  Industry: "Enterprise-level capabilities"
};

const tierColors = {
  Free: "from-blue-500 to-cyan-500",
  Demo: "from-purple-500 to-pink-500",
  Artist: "from-orange-500 to-red-500",
  Industry: "from-yellow-500 to-amber-500"
};

const GenerateSong = () => {
  const [sliderValue, setSliderValue] = useState([0]);
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentTier = tiers[sliderValue[0]];
  const currentDescription = tierDescriptions[currentTier as keyof typeof tierDescriptions];
  const currentGradient = tierColors[currentTier as keyof typeof tierColors];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !idea) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name,
          email,
          subject: `Song Generation Request - ${currentTier} Tier`,
          message: `Tier: ${currentTier}\n\nIdea: ${idea}`
        }
      });

      if (error) throw error;

      navigate("/purchase-confirmation");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Generate Your Song. HEA
          </h1>
          <p className="text-2xl text-white/90 font-medium">
            LA MUSIC ES MEDICINA
          </p>
        </div>

        <motion.div
          key={currentTier}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`bg-gradient-to-br ${currentGradient} rounded-2xl p-8 shadow-2xl mb-6`}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{currentTier}</h2>
            <p className="text-white/80 text-lg">{currentDescription}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-white text-lg font-semibold">
                Select Your Tier
              </Label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-white/70 text-sm">
                {tiers.map((tier) => (
                  <span key={tier}>{tier}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-lg font-semibold">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-lg font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea" className="text-white text-lg font-semibold">
                Your Idea
              </Label>
              <Textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Like AI but better,"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 min-h-[120px]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-purple-900 hover:bg-white/90 font-bold text-lg py-6"
              size="lg"
            >
              {isSubmitting ? "Submitting..." : "Submit Your Song Idea"}
            </Button>
          </form>
        </motion.div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80"
          >
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default GenerateSong;
