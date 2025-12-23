import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayer } from "@/hooks/usePlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { startCheckout } from "@/lib/checkout";
import { getPlayableUrlForBeat } from "@/lib/audio";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  mood: string;
  key?: string;
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
  // Use stable id comparison instead of audioUrl (which may be a resolved/signed URL)
  const isCurrent = current?.id === beat.id;

  // Neon color class mapping by genre (fallback slate)
  // Case-insensitive mapping; normalize RnB / rnb to same style
  const genreClassMap: Record<string, string> = {
    trap: "np-red nc-red",
    drill: "np-orange nc-orange",
    synthwave: "np-cyan nc-cyan",
    ambient: "np-purple nc-purple",
    lofi: "np-blue nc-blue",
    rnb: "np-pink nc-pink",
  };
  const genreKey = String(beat.genre || "").toLowerCase();
  const genreClass = genreClassMap[genreKey] || "np-slate nc-slate";

  const handlePurchase = async () => {
    // Prefer server-driven checkout if configured, else fallback to paymentLink
    try {
      if (import.meta.env.VITE_SERVER_URL) {
        await startCheckout(beat.id);
        return;
      }
      if (beat.paymentLink) {
        window.open(beat.paymentLink, "_blank");
      } else {
        alert("Purchase link not available yet.");
      }
    } catch (err) {
      console.error(err);
      // Graceful fallback: if server checkout fails but a payment link exists, use it
      if (beat.paymentLink) {
        window.open(beat.paymentLink, "_blank");
        return;
      }
      alert("Checkout failed. Please try again later.");
    }
  };

  // Use paymentLink from data; component stays data-driven
  const paymentLink = beat.paymentLink;

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
    if (isCurrent) {
      toggle();
      return;
    }
    // Resolve a playable URL dynamically (server preview, public, or signed)
    getPlayableUrlForBeat(beat)
      .then((url) =>
        playTrack({
          id: beat.id,
          title: beat.title,
          audioUrl: url,
          coverImage: beat.coverImage,
        })
      )
      .catch((e) => {
        console.error("[player] failed to resolve playable URL", e);
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
              {/* Badge: New (Top Seller removed) */}
              {(() => {
                const isNew = ["Afterglow", "Deep Space"].includes(beat.title);
                if (!isNew) return null;
                return (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                      New
                    </span>
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
                {beat.key && (
                  <button
                    type="button"
                    className="neon-pill pill-anim pill-enter pill-delay-4 np-emerald"
                    aria-label={`Filter by key ${beat.key}`}
                  >
                    {beat.key}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white relative kfi-price-underline">
                ${beat.price.toFixed(2)}
              </span>
              {/* Stripe Buy Button for "Midnight Drive" */}
              <div className="relative card-buy-zone group">
                {/* Match hero CTA glow aura */}
                <div className="pointer-events-none absolute -inset-4 md:-inset-5 rounded-2xl bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-400/25 blur-xl opacity-30 group-hover:opacity-40 transition-opacity animate-cta-pulse" />
                {/* Button matches hero CTA classes exactly */}
                <Button
                  onClick={handlePurchase}
                  className="relative z-20 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-black via-zinc-900 to-zinc-800 hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-700 btn-dark-glow hover:scale-105 btn-ripple ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-amber-400/50 group/button transition-transform duration-200 ease-out"
                >
                  <ShoppingCart className="h-4 w-4 mr-2 cart-nudge transition-transform duration-200 ease-out group-hover/button:-translate-y-0.5" />
                  Buy Now
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

function shallowBeatEqual(a: any, b: any) {
  if (a === b) return true;
  const keys = [
    "id",
    "title",
    "genre",
    "bpm",
    "mood",
    "key",
    "price",
    "audioUrl",
    "coverImage",
    "paymentLink",
  ];
  for (const k of keys) {
    if (a.beat?.[k] !== b.beat?.[k]) return false;
  }
  return true;
}

const BeatCard = React.memo(BeatCardBase, shallowBeatEqual);
export default BeatCard;
