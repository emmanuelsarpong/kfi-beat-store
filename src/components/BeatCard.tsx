import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayer } from "@/hooks/usePlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { getPlayableUrlForBeat } from "@/lib/audio";
import { getBeatHref } from "@/lib/beatSlugs";
import { MIN_LICENSE_PRICE_DISPLAY } from "@/config/licenses";
import type { BeatData } from "@/data/beats";
import BeatPurchaseModal from "@/components/BeatPurchaseModal";

interface BeatCardProps {
  beat: BeatData;
}

const BeatCardBase = ({ beat }: BeatCardProps) => {
  const navigate = useNavigate();
  const { current, isPlaying, playTrack, toggle } = usePlayer();
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const [hovering, setHovering] = useState(false);
  const [showKeyPill, setShowKeyPill] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const previewRef = useRef<HTMLAudioElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const isCurrent = current?.id === beat.id;

  useLayoutEffect(() => {
    if (beat.key) setShowKeyPill(true);
  }, [beat.id, beat.key, beat.genre, beat.bpm, beat.mood]);

  useLayoutEffect(() => {
    if (!beat.key) return;
    const el = pillsRef.current;
    if (!el) return;

    const measure = () => {
      const children = el.querySelectorAll("[data-pill]");
      if (children.length < 2) return;
      const first = children[0].getBoundingClientRect().top;
      const last = children[children.length - 1].getBoundingClientRect().top;
      const shouldShow = first === last;
      setShowKeyPill((prev) => (prev === shouldShow ? prev : shouldShow));
    };

    measure();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        measure();
      });
      resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, [beat.id, beat.key, beat.genre, beat.bpm, beat.mood]);

  const genreClassMap: Record<string, string> = {
    trap: "np-red nc-red",
    drill: "np-orange nc-orange",
    synthwave: "np-cyan nc-cyan",
    ambient: "np-purple nc-purple",
    lofi: "np-blue nc-blue",
    rnb: "np-pink nc-pink",
    afrobeats: "np-orange nc-orange",
  };
  const genreKey = String(beat.genre || "").toLowerCase();
  const genreClass = genreClassMap[genreKey] || "np-slate nc-slate";
  const exclusiveEnabled =
    !beat.sold && beat.id !== "37" && beat.exclusive_available !== false;

  const stopEvent = (
    e:
      | React.MouseEvent<HTMLElement>
      | React.KeyboardEvent<HTMLElement>
      | React.PointerEvent<HTMLElement>
  ) => {
    e.stopPropagation();
  };

  const openBeatPage = () => {
    navigate(getBeatHref(beat));
  };

  useEffect(() => {
    const audio = previewRef.current;
    if (!audio) return;
    let timeout: number | undefined;
    if (hovering && !isCurrent) {
      audio.currentTime = 0;
      audio.volume = 0;
      audio.play().catch(() => {});
      let v = 0;
      const fadeIn = setInterval(() => {
        v = Math.min(1, v + 0.1);
        audio.volume = v * 0.5;
        if (v >= 1) clearInterval(fadeIn);
      }, 50);
      timeout = window.setTimeout(() => {
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
      audio.currentTime = 0;
    }
    return () => {
      if (timeout) window.clearTimeout(timeout);
      audio.pause();
    };
  }, [hovering, isCurrent]);

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(e);
    if (isCurrent) {
      toggle();
      return;
    }
    getPlayableUrlForBeat({
      id: beat.id,
      title: beat.title,
      previewUrl: beat.previewUrl,
      audioUrl: beat.audioUrl,
    })
      .then((url) =>
        playTrack({
          id: beat.id,
          title: beat.title,
          audioUrl: url,
          coverImage: beat.coverImage,
        })
      )
      .catch((error) => {
        console.error("[player] failed to resolve playable URL", error);
      });
  };

  const favActive = isFavorite(beat.id);

  return (
    <>
      <Card
        role="link"
        tabIndex={0}
        aria-label={`Open ${beat.title} beat details`}
        className="group glass-card relative overflow-hidden rounded-xl bg-black/70 backdrop-blur-md border border-white/5 transition-all duration-300 ease-out transform-gpu hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55),0_0_44px_rgba(168,142,255,0.22)] focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={openBeatPage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBeatPage();
          }
        }}
      >
        <div
          className={`card-contour ${genreClass
            .split(" ")
            .find((c) => c.startsWith("nc-"))}`}
          aria-hidden="true"
        />
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-t-xl group/cover">
            {(() => {
              const num = parseInt(beat.id, 10);
              const paletteCount = 21;
              const forced = Number(beat.coverVariant);
              const idx =
                Number.isFinite(forced) && forced > 0
                  ? (Math.floor(forced) - 1) % paletteCount
                  : isNaN(num)
                    ? Math.abs(
                        Array.from(beat.id).reduce(
                          (a, c) => a + c.charCodeAt(0),
                          0
                        )
                      ) % paletteCount
                    : (num - 1) % paletteCount;
              const gradClass = `grad-beat-${idx + 1}`;
              return (
                <div
                  role="img"
                  aria-label={`${beat.title} cover artwork`}
                  className={`grad-beat-base ${gradClass} transition-transform duration-500 ease-out group-hover/cover:scale-105`}
                />
              );
            })()}

            <button
              type="button"
              aria-label={favActive ? "Remove from favorites" : "Add to favorites"}
              onClick={(e) => {
                stopEvent(e);
                toggleFav({
                  id: beat.id,
                  title: beat.title,
                  coverImage: beat.coverImage,
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

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/65 opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handlePlayClick}
                size="lg"
                aria-label={isCurrent && isPlaying ? "Pause preview" : "Play preview"}
                className="rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 border-0"
              >
                {isCurrent && isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
            </div>
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

          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-0 -top-6 bottom-0 bg-black/30 backdrop-blur-md" />
            <div className="relative p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-white text-xl tracking-tight">
                  {beat.title}
                </h3>
                <div ref={pillsRef} className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    type="button"
                    data-pill
                    onClick={stopEvent}
                    className={`neon-pill pill-anim pill-enter pill-delay-1 ${genreClass}`}
                    aria-label={`Genre ${beat.genre}`}
                  >
                    {beat.genre}
                  </button>
                  <button
                    type="button"
                    data-pill
                    onClick={stopEvent}
                    className="neon-pill pill-anim pill-enter pill-delay-2 np-cyan"
                    aria-label={`${beat.bpm} BPM`}
                  >
                    {beat.bpm} BPM
                  </button>
                  <button
                    type="button"
                    data-pill
                    onClick={stopEvent}
                    className="neon-pill pill-anim pill-enter pill-delay-3 np-purple"
                    aria-label={`Mood ${beat.mood}`}
                  >
                    {beat.mood}
                  </button>
                  {beat.key && showKeyPill && (
                    <button
                      type="button"
                      data-pill
                      onClick={stopEvent}
                      className="neon-pill pill-anim pill-enter pill-delay-4 np-emerald"
                      aria-label={`Key ${beat.key}`}
                    >
                      {beat.key}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                    Licenses from ${MIN_LICENSE_PRICE_DISPLAY.toFixed(0)}
                  </span>
                  {beat.sold ? (
                    <span className="text-sm font-semibold text-zinc-400">
                      Exclusive Sold
                    </span>
                  ) : exclusiveEnabled ? (
                    <span className="text-lg font-semibold text-white">
                      Exclusive ${beat.price.toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-zinc-500">
                      Exclusive unavailable
                    </span>
                  )}
                </div>

                <div className="relative card-buy-zone group shrink-0">
                  <div className="pointer-events-none absolute -inset-4 md:-inset-5 rounded-2xl bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-400/25 blur-xl opacity-30 group-hover:opacity-40 transition-opacity animate-cta-pulse" />
                  <Button
                    onClick={(e) => {
                      stopEvent(e);
                      if (!beat.sold) setShowPurchaseModal(true);
                    }}
                    disabled={beat.sold === true}
                    className="relative z-20 px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-black via-zinc-900 to-zinc-800 hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-700 btn-dark-glow hover:scale-105 btn-ripple ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-amber-400/50 group/button transition-transform duration-200 ease-out disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2 cart-nudge transition-transform duration-200 ease-out group-hover/button:-translate-y-0.5" />
                    {beat.sold ? "Sold" : "Buy"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <audio ref={previewRef}>
            <source src={beat.previewUrl || beat.audioUrl} type="audio/mpeg" />
          </audio>
        </CardContent>
      </Card>

      <BeatPurchaseModal
        beat={beat}
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
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
    "previewUrl",
    "audioUrl",
    "coverImage",
    "coverVariant",
    "paymentLink",
    "sold",
    "exclusive_available",
    "hasStems",
  ];
  for (const k of keys) {
    if (a.beat?.[k] !== b.beat?.[k]) return false;
  }
  return true;
}

const BeatCard = React.memo(BeatCardBase, shallowBeatEqual);
export default BeatCard;
