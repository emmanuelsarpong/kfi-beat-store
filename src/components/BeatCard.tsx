import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayer } from "@/hooks/usePlayer";
import { useFavorites } from "@/hooks/useFavorites";

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

const BeatCardBase = ({ beat }: BeatCardProps) => {
  const { current, isPlaying, playTrack, toggle } = usePlayer();
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const [hovering, setHovering] = useState(false);
  const previewRef = useRef<HTMLAudioElement>(null);
  const isCurrent = current?.audioUrl === beat.audioUrl;

  // Neon color class mapping by genre (fallback slate)
  const genreClassMap: Record<string, string> = {
    Trap: "np-red nc-red",
    Drill: "np-orange nc-orange",
    Synthwave: "np-cyan nc-cyan",
    Ambient: "np-purple nc-purple",
    LoFi: "np-blue nc-blue",
    RnB: "np-pink nc-pink",
  };
  const genreClass = genreClassMap[beat.genre] || "np-slate nc-slate";

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

  // hover preview: play up to 5s with fade in/out
  useEffect(() => {
    const audio = previewRef.current;
    if (!audio) return;
    let timeout: number | undefined;
    if (hovering && !isCurrent) {
      audio.currentTime = 0;
      audio.volume = 0;
      audio.play().catch(() => {});
      // fade in
      let v = 0;
      const fadeIn = setInterval(() => {
        v = Math.min(1, v + 0.1);
        audio.volume = v * 0.5; // cap preview volume
        if (v >= 1) clearInterval(fadeIn);
      }, 50);
      timeout = window.setTimeout(() => {
        // fade out and stop
        let out = audio.volume;
        const fadeOut = setInterval(() => {
          out = Math.max(0, out - 0.1);
          audio.volume = out;
          if (out <= 0) {
            clearInterval(fadeOut);
            audio.pause();
          }
        }, 50);
      }, 5000);
    } else {
      audio.pause();
    }
    return () => {
      if (timeout) window.clearTimeout(timeout);
      audio.pause();
    };
  }, [hovering, isCurrent]);

  const handlePlayClick = () => {
    if (isCurrent) toggle();
    else
      playTrack({
        id: beat.id,
        title: beat.title,
        audioUrl: beat.audioUrl,
        coverImage: beat.coverImage,
      });
  };

  const favActive = isFavorite(beat.id);

  return (
    <Card
      className="group glass-card relative overflow-hidden rounded-xl bg-black/70 backdrop-blur-md border border-white/5 transition-all duration-300 ease-out transform-gpu hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55),0_0_44px_rgba(168,142,255,0.22)]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Neon contour outline */}
      <div
        className={`card-contour ${genreClass
          .split(" ")
          .find((c) => c.startsWith("nc-"))}`}
        aria-hidden="true"
      />
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-xl group/cover">
          {/* Gradient cover (replaces image) */}
          {(() => {
            // Deterministic gradient pick based on id numeric fallback to hash.
            const num = parseInt(beat.id, 10);
            const paletteCount = 20; // defined in index.css
            const idx = isNaN(num)
              ? Math.abs(
                  Array.from(beat.id).reduce((a, c) => a + c.charCodeAt(0), 0)
                ) % paletteCount
              : (num - 1) % paletteCount;
            const gradClass = `grad-beat-${idx + 1}`;
            return (
              <div
                role="img"
                aria-label={`${beat.title} cover artwork (abstract gradient)`}
                className={`grad-beat-base ${gradClass} transition-transform duration-500 ease-out group-hover/cover:scale-105`}
              />
            );
          })()}
          {/* Favorite button */}
          <button
            type="button"
            aria-label={
              favActive ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={favActive ? "true" : "false"}
            onClick={(e) => {
              e.stopPropagation();
              toggleFav({
                id: beat.id,
                title: beat.title,
                coverImage: beat.coverImage, // still stored for potential future use
                genre: beat.genre,
                bpm: beat.bpm,
              });
            }}
            className={`fav-btn ${favActive ? "is-fav" : ""}`}
          >
            <Heart
              className={`h-5 w-5 heart-pop ${
                favActive ? "fill-white drop-shadow" : ""
              }`}
              strokeWidth={1.8}
            />
          </button>
          {/* top->bottom darkening for text clarity */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/65 opacity-100 transition-opacity duration-300" />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={handlePlayClick}
              size="lg"
              className="rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 border-0"
            >
              {isCurrent && isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
          {/* Optional ambient mini waveform in corner */}
          <div className="pointer-events-none absolute bottom-2 right-2 opacity-30">
            <div className="kfi-mini-wave">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        {/* Stronger blur behind text area for depth */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-x-0 -top-6 bottom-0 bg-black/30 backdrop-blur-md" />
          <div className="relative p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-white text-xl tracking-tight">
                {beat.title}
              </h3>
              {/* Highlight badges (demo-driven until data supports it) */}
              {(() => {
                const topSeller = ["Midnight Drive", "Neon Dreams"].includes(
                  beat.title
                );
                const isNew = ["Afterglow", "Deep Space"].includes(beat.title);
                if (!topSeller && !isNew) return null;
                return (
                  <div className="mt-2 flex items-center gap-2">
                    {topSeller && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                        Top Seller
                      </span>
                    )}
                    {isNew && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                        New
                      </span>
                    )}
                  </div>
                );
              })()}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {/* Genre neon pill */}
                <button
                  type="button"
                  className={`neon-pill pill-anim pill-enter pill-delay-1 ${genreClass}`}
                  aria-label={`Filter by ${beat.genre}`}
                >
                  {beat.genre}
                </button>
                {/* BPM pill */}
                <button
                  type="button"
                  className="neon-pill pill-anim pill-enter pill-delay-2 np-cyan"
                  aria-label={`Filter by ${beat.bpm} BPM`}
                >
                  {beat.bpm} BPM
                </button>
                {/* Mood pill */}
                <button
                  type="button"
                  className="neon-pill pill-anim pill-enter pill-delay-3 np-purple"
                  aria-label={`Filter by ${beat.mood}`}
                >
                  {beat.mood}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white relative kfi-price-underline">
                ${beat.price}
              </span>
              {/* Stripe Buy Button for "Midnight Drive" */}
              <div className="relative card-buy-zone group">
                {/* Match hero CTA glow aura */}
                <div className="pointer-events-none absolute -inset-4 md:-inset-5 rounded-2xl bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-400/25 blur-xl opacity-30 group-hover:opacity-40 transition-opacity animate-cta-pulse" />
                {/* Button matches hero CTA classes exactly */}
                <Button
                  asChild
                  className="relative z-20 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-black via-zinc-900 to-zinc-800 hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-700 btn-dark-glow hover:scale-105 btn-ripple ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-amber-400/50 group/button transition-transform duration-200 ease-out"
                >
                  <a
                    href={paymentLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2 cart-nudge transition-transform duration-200 ease-out group-hover/button:-translate-y-0.5" />
                    Buy Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* silent preview element */}
        <audio ref={previewRef}>
          <source src={beat.audioUrl} type="audio/mpeg" />
        </audio>
      </CardContent>
    </Card>
  );
};

const BeatCard = React.memo(BeatCardBase);
export default BeatCard;
