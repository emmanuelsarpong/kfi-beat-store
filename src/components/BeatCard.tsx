import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Pause, Play, Plus } from "lucide-react";
import BeatArtwork from "@/components/BeatArtwork";
import BeatPurchaseModal from "@/components/BeatPurchaseModal";
import { usePlayer } from "@/hooks/usePlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { startBeatPlayback } from "@/lib/playBeat";
import { getBeatHref } from "@/lib/beatSlugs";
import { formatGenre, formatKey, startingPriceLabel } from "@/lib/catalog";
import { getAccentColor } from "@/lib/artwork";
import type { BeatData } from "@/data/beats";
import { cn } from "@/lib/utils";

interface BeatCardProps {
  beat: BeatData;
}

const BeatCardBase = ({ beat }: BeatCardProps) => {
  const navigate = useNavigate();
  const { current, isPlaying, playTrack, toggle, currentTime, duration } = usePlayer();
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const isCurrent = current?.id === beat.id;
  const playing = isCurrent && isPlaying;
  const accent = getAccentColor(beat);
  const favActive = isFavorite(beat.id);
  const progress =
    isCurrent && duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const stopEvent = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    e.stopPropagation();
  };

  const openBeatPage = () => navigate(getBeatHref(beat));

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    stopEvent(e);
    if (isCurrent) {
      toggle();
      return;
    }
    startBeatPlayback(beat, playTrack).catch((error) => {
      console.error("[player] failed to resolve playable URL", error);
    });
  };

  return (
    <>
      <article
        role="link"
        tabIndex={0}
        aria-label={`Open ${beat.title} beat details`}
        className="group cursor-pointer"
        onClick={openBeatPage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBeatPage();
          }
        }}
      >
        <div className="relative overflow-hidden rounded-[14px]">
          <BeatArtwork
            beat={beat}
            playing={playing}
            className="aspect-square w-full rounded-[14px] lg:transition-transform lg:duration-300 lg:group-hover:scale-[1.02]"
          />
          <button
            type="button"
            aria-label={favActive ? "Remove from saved beats" : "Save beat"}
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
            className={cn(
              "absolute top-2 right-2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-[#6F6F69] backdrop-blur-sm lg:hidden",
              favActive && "text-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", favActive && "fill-current")} strokeWidth={1.7} />
          </button>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handlePlayClick}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="pointer-events-auto inline-flex h-14 w-14 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft backdrop-blur-sm"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
          </div>
          {playing ? (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/10">
              <div
                className="h-full"
                style={{ width: `${progress * 100}%`, background: accent }}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 lg:mt-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[18px] lg:text-[17px] tracking-display leading-tight">
              {beat.title}
            </h3>
            <p className="mt-1.5 lg:mt-1 text-[14px] lg:text-[13px] text-[#6F6F69]">
              {formatGenre(beat.genre)}
              {beat.mood ? ` / ${beat.mood}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label={favActive ? "Remove from saved beats" : "Save beat"}
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
            className={cn(
              "mt-0.5 hidden h-8 w-8 shrink-0 lg:inline-flex items-center justify-center text-[#999991] hover:text-foreground",
              favActive && "text-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", favActive && "fill-current")} strokeWidth={1.7} />
          </button>
        </div>

        <div className="mt-2.5 lg:mt-2 flex items-center justify-between text-[13px] lg:text-[12px] tabular-nums text-[#999991]">
          <span>{beat.bpm} BPM</span>
          {beat.key ? <span>{formatKey(beat.key)}</span> : <span />}
        </div>

        <div className="mt-3.5 lg:mt-3 flex items-center justify-between">
          <span className="text-sm tabular-nums text-foreground">
            {beat.sold ? "Sold" : startingPriceLabel()}
          </span>
          <button
            type="button"
            disabled={beat.sold === true}
            onClick={(e) => {
              stopEvent(e);
              if (!beat.sold) setShowPurchaseModal(true);
            }}
            className="inline-flex h-11 w-11 lg:h-8 lg:w-8 items-center justify-center rounded-[8px] border border-black/[0.08] text-foreground hover:bg-white disabled:opacity-40"
            aria-label={beat.sold ? "Sold" : "Choose license"}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </article>

      <BeatPurchaseModal
        beat={beat}
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  );
};

function shallowBeatEqual(a: { beat: BeatData }, b: { beat: BeatData }) {
  if (a === b) return true;
  const keys: (keyof BeatData)[] = [
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
  return keys.every((key) => a.beat?.[key] === b.beat?.[key]);
}

const BeatCard = React.memo(BeatCardBase, shallowBeatEqual);
export default BeatCard;
