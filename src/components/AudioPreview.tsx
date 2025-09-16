import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AudioPreviewProps {
  productName: string;
  hasComparison: boolean;
  // Single audio preview
  audioPreviewUrl?: string | null;
  // Multiple audio previews
  audioPreviewDry?: string | null;
  audioPreviewWet?: string | null;
  audioPreviewComparison?: string | null;
  className?: string;
}

const AudioPreview = ({
  productName,
  hasComparison,
  audioPreviewUrl,
  audioPreviewDry,
  audioPreviewWet,
  audioPreviewComparison,
  className = "",
}: AudioPreviewProps) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Stop all other audio when one starts playing
  const handlePlay = (audioType: string, audioUrl: string) => {
    // Stop all other audio
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (key !== audioType && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    const audio = audioRefs.current[audioType];
    if (!audio) return;

    if (currentlyPlaying === audioType) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      audio.play();
      setCurrentlyPlaying(audioType);
    }
  };

  // Create audio element and set up event listeners
  const createAudioElement = (audioType: string, audioUrl: string) => {
    if (!audioRefs.current[audioType]) {
      const audio = new Audio(audioUrl);
      audio.preload = 'metadata';
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        if (currentlyPlaying === audioType) {
          setCurrentTime(audio.currentTime);
        }
      });

      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setCurrentTime(0);
      });

      audioRefs.current[audioType] = audio;
    }
  };

  // Cleanup audio elements
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', () => {});
      });
    };
  }, []);

  // Single audio preview component
  const SingleAudioPreview = ({ url }: { url: string }) => {
    createAudioElement('single', url);
    
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePlay('single', url)}
              className="flex-shrink-0"
            >
              {currentlyPlaying === 'single' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Audio Preview</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-100"
                  style={{
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Multiple audio previews component
  const MultipleAudioPreviews = () => {
    const audioTypes = [
      { key: 'dry', url: audioPreviewDry, label: 'Dry', description: 'Original sound' },
      { key: 'wet', url: audioPreviewWet, label: 'Wet', description: 'With effects' },
      { key: 'comparison', url: audioPreviewComparison, label: 'Comparison', description: 'Before & after' },
    ].filter(item => item.url);

    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Audio Previews</span>
              <Badge variant="secondary" className="text-xs">
                {audioTypes.length} samples
              </Badge>
            </div>
            
            {audioTypes.map(({ key, url, label, description }) => {
              if (!url) return null;
              createAudioElement(key, url);
              
              return (
                <div key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlay(key, url)}
                    className="flex-shrink-0"
                  >
                    {currentlyPlaying === key ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-100"
                        style={{
                          width: duration > 0 && currentlyPlaying === key ? `${(currentTime / duration) * 100}%` : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Determine which audio previews are available
  if (hasComparison && (audioPreviewDry || audioPreviewWet || audioPreviewComparison)) {
    return <MultipleAudioPreviews />;
  } else if (audioPreviewUrl) {
    return <SingleAudioPreview url={audioPreviewUrl} />;
  }

  return null;
};

export default AudioPreview;