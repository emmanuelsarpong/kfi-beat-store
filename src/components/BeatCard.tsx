import { useState, useRef } from "react";
import { Play, Pause, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  mood: string;
  price: number;
  audioUrl: string;
  coverImage?: string;
  paymentLink?: string;
}

interface BeatCardProps {
  beat: Beat;
}

const BeatCard = ({ beat, ...props }: BeatCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePurchase = () => {
    if (beat.paymentLink) {
      window.open(beat.paymentLink, "_blank");
    } else {
      alert("Purchase link not available yet.");
    }
  };

  // Stripe payment link for "Midnight Drive"
  const paymentLink =
    beat.title === "Midnight Drive"
      ? "https://buy.stripe.com/test_28E14g7W4gyR5BudbQ6AM00"
      : beat.paymentLink;

  return (
    <Card className="group bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-transform duration-200 ease-out hover:-translate-y-1 rounded-md">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-md">
          <img
            src={beat.coverImage}
            alt={beat.title}
            loading="lazy"
            className="w-full h-48 object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={handlePlayPause}
              size="lg"
              className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-white text-lg">{beat.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className="bg-black text-white border border-zinc-200"
              >
                {beat.genre}
              </Badge>
              <span className="text-gray-400 text-sm font-medium">
                {beat.bpm} BPM
              </span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-400 text-sm font-medium">
                {beat.mood}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">${beat.price}</span>
            {/* Stripe Buy Button for "Midnight Drive" */}
            <Button asChild>
              <a
                href={paymentLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now
              </a>
            </Button>
          </div>
        </div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)}>
          <source src={beat.audioUrl} type="audio/mpeg" />
        </audio>
      </CardContent>
    </Card>
  );
};

export default BeatCard;
