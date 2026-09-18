import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Pause, Play, Plus } from "lucide-react";
import BeatArtwork from "@/components/BeatArtwork";
import BeatPurchaseModal from "@/components/BeatPurchaseModal";
import { usePlayer } from "@/hooks/usePlayer";
import { useCart } from "@/hooks/useCart";
import { startBeatPlayback } from "@/lib/playBeat";
import { getBeatHref } from "@/lib/beatSlugs";
import type { BeatData } from "@/data/beats";
import { formatGenre, formatKey, startingPriceLabel } from "@/lib/catalog";
import { getLicenseDisplayLabel } from "@/lib/beatLicenses";

type FavoriteBeatRowProps = {
  beat: BeatData;
  onRemoveFavorite: () => void;
};

export default function FavoriteBeatRow({
  beat,
  onRemoveFavorite,
}: FavoriteBeatRowProps) {
  const { current, isPlaying, playTrack, toggle } = usePlayer();
  const { getItem } = useCart();
  const [showModal, setShowModal] = useState(false);
  const isCurrent = current?.id === beat.id;
  const cartItem = getItem(beat.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      toggle();
      return;
    }
    startBeatPlayback(beat, playTrack).catch((err) => console.error("[player]", err));
  };

  return (
    <>
      <div className="py-5 border-b border-black/[0.06]">
        <div className="flex gap-4 sm:gap-5">
          <Link to={getBeatHref(beat)} className="shrink-0">
            <BeatArtwork
              beat={beat}
              playing={isCurrent && isPlaying}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-[12px]"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={getBeatHref(beat)}>
                  <h2 className="font-display text-xl tracking-display">{beat.title}</h2>
                </Link>
                <p className="mt-1 text-sm text-[#6F6F69]">
                  {formatGenre(beat.genre)}
                  {beat.mood ? ` / ${beat.mood}` : ""}
                </p>
                <p className="mt-2 text-[12px] tabular-nums text-[#999991]">
                  {beat.bpm} BPM{beat.key ? ` · ${formatKey(beat.key)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onRemoveFavorite}
                aria-label="Remove from saved beats"
                className="inline-flex h-11 w-11 items-center justify-center text-foreground"
              >
                <Heart className="h-4 w-4 fill-current" strokeWidth={1.7} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className="inline-flex min-h-11 items-center gap-2 text-sm"
              >
                {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isCurrent && isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                disabled={beat.sold === true}
                onClick={() => setShowModal(true)}
                className="inline-flex min-h-11 items-center gap-2 text-sm disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {beat.sold ? "Sold" : startingPriceLabel()}
              </button>
              {cartItem ? (
                <span className="text-[12px] text-[#999991]">
                  In cart · {getLicenseDisplayLabel(cartItem.selectedLicense)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <BeatPurchaseModal beat={beat} open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
