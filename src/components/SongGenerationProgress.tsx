import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Music, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SongGenerationProgressProps {
  status: string;
  songIdea?: string;
  tier?: string;
  requestId?: string;
  onDownload?: () => void;
}

export const SongGenerationProgress = ({ status, songIdea, tier, requestId, onDownload }: SongGenerationProgressProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "generating":
        return {
          icon: <Loader2 className="h-6 w-6 animate-spin text-blue-500" />,
          title: "Generating Your Song...",
          description: "Our AI is composing your music. This may take a few minutes.",
          color: "text-blue-600",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          progress: 50,
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          title: "Song Ready!",
          description: "Your song has been generated and is ready to download.",
          color: "text-green-600",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          progress: 100,
        };
      case "failed":
        return {
          icon: <XCircle className="h-6 w-6 text-red-500" />,
          title: "Generation Failed",
          description: "Something went wrong. Please try again or contact support.",
          color: "text-red-600",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          progress: 0,
        };
      case "pending_payment":
        return {
          icon: <Music className="h-6 w-6 text-orange-500" />,
          title: "Awaiting Payment",
          description: "Complete your payment to start production.",
          color: "text-orange-600",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          progress: 0,
        };
      default:
        return {
          icon: <Music className="h-6 w-6 text-gray-500" />,
          title: "Pending",
          description: "Your request is being processed.",
          color: "text-gray-600",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/20",
          progress: 25,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${config.borderColor}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${config.bgColor}`}>
              {config.icon}
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className={`text-lg font-semibold ${config.color}`}>
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>

              {songIdea && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Song Idea:</p>
                  <p className="text-sm text-muted-foreground italic">
                    "{songIdea.substring(0, 100)}{songIdea.length > 100 ? "..." : ""}"
                  </p>
                </div>
              )}

              {tier && (
                <Badge variant="outline" className="w-fit">
                  {tier}
                </Badge>
              )}

              {status === "generating" && (
                <div className="space-y-2">
                  <Progress value={config.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Estimated time: 2-3 minutes
                  </p>
                </div>
              )}

              {status === "completed" && onDownload && (
                <Button 
                  onClick={onDownload}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Song
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
