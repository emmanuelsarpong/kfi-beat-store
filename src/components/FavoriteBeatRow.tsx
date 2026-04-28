import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Play, Pause, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import BeatPurchaseModal from "@/components/BeatPurchaseModal";
import { usePlayer } from "@/hooks/usePlayer";
import { useCart } from "@/hooks/useCart";
import { getPlayableUrlForBeat } from "@/lib/audio";
import { getBeatHref } from "@/lib/beatSlugs";
import type { BeatData } from "@/data/beats";
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

  const num = parseInt(beat.id, 10);
  const paletteCount = 22;
  const forced = Number(beat.coverVariant);
  const idx =
    Number.isFinite(forced) && forced > 0
      ? (Math.floor(forced) - 1) % paletteCount
      : Number.isFinite(num)
        ? (num - 1) % paletteCount
        : Math.abs(
            Array.from(beat.id).reduce((a, c) => a + c.charCodeAt(0), 0)
          ) % paletteCount;
  const gradClass = `grad-beat-${idx + 1}`;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      .catch((err) => console.error("[player]", err));
  };

  return (
    <>
      <div className="group rounded-2xl border border-white/[0.07] bg-zinc-950/60 hover:border-white/[0.12] transition-colors overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 p-4 sm:p-5">
          <Link
            to={getBeatHref(beat)}
            className="shrink-0 flex sm:block gap-4 sm:gap-0 min-w-0"
          >
            <div
              className={`grad-beat-base ${gradClass} h-24 w-24 sm:h-28 sm:w-28 rounded-xl shrink-0 scale-105`}
              aria-hidden
            />
            <div className="sm:hidden min-w-0 flex-1">
              <h2 className="font-semibold text-white text-lg leading-tight truncate">
                {beat.title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {beat.genre} · {beat.bpm} BPM
                {beat.mood ? ` · ${beat.mood}` : ""}
              </p>
            </div>
          </Link>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-3">
            <div className="hidden sm:block">
              <Link to={getBeatHref(beat)}>
                <h2 className="font-semibold text-white text-xl tracking-tight hover:text-amber-100/90 transition-colors">
                  {beat.title}
                </h2>
              </Link>
              <p className="text-sm text-zinc-500 mt-1">
                {beat.genre} · {beat.bpm} BPM
                {beat.mood ? ` · ${beat.mood}` : ""}
                {beat.key ? ` · ${beat.key}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {cartItem ? (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/15 text-amber-200/90 border border-amber-400/25">
                  In cart · {getLicenseDisplayLabel(cartItem.selectedLicense)}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePlay}
                className="rounded-full border-white/12 bg-white/[0.04] text-zinc-100 h-9"
              >
                {isCurrent && isPlaying ? (
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                )}
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={beat.sold === true}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="rounded-full border-white/12 bg-white/[0.04] text-zinc-100 h-9"
              >
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                Add to cart
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={beat.sold === true}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="rounded-full h-9 bg-[linear-gradient(135deg,#1a1a1a,#0c0c0c)] border border-white/12 text-white"
              >
                Buy
              </Button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveFavorite();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded-full transition-colors"
                aria-label="Remove from favorites"
              >
                <Heart className="h-3.5 w-3.5" strokeWidth={1.8} />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <BeatPurchaseModal
        beat={beat}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
