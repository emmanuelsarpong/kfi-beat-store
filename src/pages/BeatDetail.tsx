import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingCart, ChevronLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatPurchaseModal from "@/components/BeatPurchaseModal";
import WaveformPlayer from "@/components/WaveformPlayer";
import { Button } from "@/components/ui/button";
import { beats as staticBeats, type BeatData } from "@/data/beats";
import { useBeats } from "@/hooks/useBeats";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import {
  getBeatLicenseOptions,
  getLicenseDisplayLabel,
} from "@/lib/beatLicenses";
import { findBeatBySlug } from "@/lib/beatSlugs";
import { MIN_LICENSE_PRICE_DISPLAY } from "@/config/licenses";

function BeatArtwork({ beat }: { beat: BeatData }) {
  const num = parseInt(beat.id, 10);
  const paletteCount = 21;
  const forced = Number(beat.coverVariant);
  const idx =
    Number.isFinite(forced) && forced > 0
      ? (Math.floor(forced) - 1) % paletteCount
      : isNaN(num)
        ? Math.abs(Array.from(beat.id).reduce((a, c) => a + c.charCodeAt(0), 0)) %
          paletteCount
        : (num - 1) % paletteCount;
  const gradClass = `grad-beat-${idx + 1}`;

  return (
    <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div
        role="img"
        aria-label={`${beat.title} artwork`}
        className={`grad-beat-base ${gradClass} h-full w-full scale-[1.02]`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.34)_68%,rgba(0,0,0,0.75))]" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-300/80">
          KFI Beat Store
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          {beat.title}
        </h1>
      </div>
    </div>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-200">
      {children}
    </span>
  );
}

export default function BeatDetail() {
  const { slug } = useParams();
  const { beats } = useBeats();
  const { isFavorite, toggle } = useFavorites();
  const { getItem, isInCart } = useCart();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const beat = useMemo(() => {
    return findBeatBySlug(beats ?? staticBeats, slug) ?? null;
  }, [beats, slug]);

  useEffect(() => {
    if (!beat) return;
    const previousTitle = document.title;
    document.title = `${beat.title} Beat | KFI Beat Store`;

    const descriptionContent = `${beat.title} is a ${beat.genre} beat at ${beat.bpm} BPM${beat.key ? ` in ${beat.key}` : ""}. Preview the beat, explore licenses, and buy instantly.`;
    let meta = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
      created = true;
    }
    const previousDescription = meta.getAttribute("content");
    meta.setAttribute("content", descriptionContent);

    return () => {
      document.title = previousTitle;
      if (created) {
        meta?.remove();
      } else if (meta && previousDescription != null) {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [beat]);

  if (!beat && beats) {
    return <Navigate to="/store" replace />;
  }

  const currentBeat = beat ?? findBeatBySlug(staticBeats, slug);
  if (!currentBeat) {
    return <Navigate to="/store" replace />;
  }

  const exclusiveText = currentBeat.sold
    ? "Exclusive Sold"
    : currentBeat.exclusive_available === false || currentBeat.id === "37"
      ? "Exclusive unavailable"
      : `Exclusive $${currentBeat.price.toFixed(0)}`;

  const exclusivePanelText = currentBeat.sold
    ? "Sold"
    : currentBeat.exclusive_available === false || currentBeat.id === "37"
      ? "Unavailable"
      : `$${currentBeat.price.toFixed(0)}`;
  const cartItem = getItem(currentBeat.id);
  const licenseOptions = getBeatLicenseOptions(currentBeat);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(148,163,255,0.12),transparent_48%),radial-gradient(circle_at_20%_18%,rgba(239,68,68,0.14),transparent_34%)]" />

        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pb-20">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to store
          </Link>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-8 xl:gap-10 items-start">
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-5 sm:gap-7 items-center">
                <BeatArtwork beat={currentBeat} />

                <div className="min-w-0">
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      Single Track
                    </p>
                    <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
                      {currentBeat.title}
                    </h1>
                    <div className="flex flex-wrap gap-2.5">
                      <MetaPill>{currentBeat.genre}</MetaPill>
                      <MetaPill>{currentBeat.bpm} BPM</MetaPill>
                      {currentBeat.mood && <MetaPill>{currentBeat.mood}</MetaPill>}
                      {currentBeat.key && <MetaPill>{currentBeat.key}</MetaPill>}
                    </div>
                  </div>
                </div>
              </div>

              <WaveformPlayer beat={currentBeat} />
            </div>

            <aside className="xl:sticky xl:top-24">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      Pricing
                    </p>
                    <p className="mt-3 text-sm text-zinc-400">
                      Licenses from ${MIN_LICENSE_PRICE_DISPLAY.toFixed(0)}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                      {exclusiveText}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={
                      isFavorite(currentBeat.id)
                        ? "Remove from favorites"
                        : "Save beat"
                    }
                    onClick={() =>
                      toggle({
                        id: currentBeat.id,
                        title: currentBeat.title,
                        coverImage: currentBeat.coverImage,
                        genre: currentBeat.genre,
                        bpm: currentBeat.bpm,
                      })
                    }
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08] transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFavorite(currentBeat.id) ? "fill-white" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-white/8 bg-black/30 p-4 text-sm text-zinc-300 space-y-3">
                  {licenseOptions.map((option, index) => (
                    <div key={option.type}>
                      {index === 3 && <div className="h-px bg-white/6 mb-3" />}
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span
                          className={
                            option.available ? "text-zinc-100" : "text-zinc-500"
                          }
                        >
                          {option.available
                            ? `$${option.price.toFixed(0)}`
                            : option.type === "exclusive"
                              ? exclusivePanelText
                              : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {currentBeat.hasStems === false && (
                    <p className="pt-1 text-xs text-zinc-500">
                      Unlimited is unavailable until stems are available.
                    </p>
                  )}
                </div>

                {isInCart(currentBeat.id) && cartItem && (
                  <p className="mt-4 text-xs text-amber-200/90 tracking-wide">
                    In cart — {getLicenseDisplayLabel(cartItem.selectedLicense)}.
                    Open the cart to change it or check out.
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-2.5">
                  <Button
                    onClick={() => setShowPurchaseModal(true)}
                    disabled={currentBeat.sold === true}
                    className="w-full h-12 rounded-2xl font-semibold text-white bg-[linear-gradient(135deg,#131313,#050505)] border border-white/15 hover:border-white/25 hover:-translate-y-[1px] transition-transform disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {currentBeat.sold ? "Exclusive Sold" : "Buy or Lease"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentBeat.sold === true}
                    onClick={() => setShowPurchaseModal(true)}
                    className="w-full h-11 rounded-2xl font-medium border-white/12 bg-white/[0.03] text-zinc-100 hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                  >
                    Add to cart
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <BeatPurchaseModal
        beat={currentBeat}
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
      <Footer />
    </div>
  );
}
