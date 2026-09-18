import { useEffect, useMemo, useState } from "react";
import { Heart, ChevronLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatArtwork from "@/components/BeatArtwork";
import LicensePicker, { shortLicenseLabel } from "@/components/LicensePicker";
import RelatedBeats from "@/components/RelatedBeats";
import WaveformPlayer from "@/components/WaveformPlayer";
import { Button } from "@/components/ui/button";
import { beats as staticBeats } from "@/data/beats";
import { useBeats } from "@/hooks/useBeats";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { getLicenseDisplayLabel } from "@/lib/beatLicenses";
import { findBeatBySlug } from "@/lib/beatSlugs";
import { formatCatalogLabel, formatGenre, formatKey, formatPrice } from "@/lib/catalog";
import { getAccentColor } from "@/lib/artwork";
import { getBeatLicenseOptions } from "@/lib/beatLicenses";
import type { LicenseType } from "@/config/licenses";
import BeatPurchaseModal from "@/components/BeatPurchaseModal";
import { toast } from "sonner";

export default function BeatDetail() {
  const { slug } = useParams();
  const { beats } = useBeats();
  const { isFavorite, toggle } = useFavorites();
  const { getItem, isInCart, addItemWithLicense, openDrawer } = useCart();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>("premium");

  const beat = useMemo(() => {
    return findBeatBySlug(beats ?? staticBeats, slug) ?? null;
  }, [beats, slug]);

  useEffect(() => {
    if (!beat) return;
    document.title = beat.title;
    const descriptionContent = `${beat.title} is a ${beat.genre} beat at ${beat.bpm} BPM${beat.key ? ` in ${beat.key}` : ""}. Preview the beat, explore licenses, and buy instantly.`;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
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
      if (created) meta?.remove();
      else if (meta && previousDescription != null) meta.setAttribute("content", previousDescription);
    };
  }, [beat]);

  if (!beat && beats) return <Navigate to="/store" replace />;
  const currentBeat = beat ?? findBeatBySlug(staticBeats, slug);
  if (!currentBeat) return <Navigate to="/store" replace />;

  const cartItem = getItem(currentBeat.id);
  const options = getBeatLicenseOptions(currentBeat);
  const selectedOption =
    options.find((option) => option.type === selectedLicense && option.available) ??
    options.find((option) => option.available);
  const accent = getAccentColor(currentBeat);
  const catalog = beats ?? staticBeats;

  const handleContinue = () => {
    if (!selectedOption?.available) return;
    addItemWithLicense(currentBeat, selectedOption.type);
    toast.success("Added to cart", {
      description: `${currentBeat.title} · ${shortLicenseLabel(selectedOption.type)}`,
    });
    openDrawer();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 lg:pt-12 pb-16">
          <Link
            to="/store"
            className="inline-flex min-h-11 items-center gap-2 text-[13px] text-[#6F6F69] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="lg:hidden">Back to beats</span>
            <span className="hidden lg:inline">All beats</span>
          </Link>

          <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div
              className="lg:col-span-5 rounded-[18px] p-2 sm:p-3"
              style={{ background: `${accent}12` }}
            >
              <BeatArtwork
                beat={currentBeat}
                className="aspect-square w-full rounded-[14px]"
                priority
              />
            </div>

            <div className="lg:col-span-7">
              <TrackHeader
                beat={currentBeat}
                isFavorite={isFavorite(currentBeat.id)}
                onFavorite={() =>
                  toggle({
                    id: currentBeat.id,
                    title: currentBeat.title,
                    coverImage: currentBeat.coverImage,
                    genre: currentBeat.genre,
                    bpm: currentBeat.bpm,
                  })
                }
              />
              <div className="mt-7 lg:mt-8">
                <WaveformPlayer beat={currentBeat} />
              </div>
              <div className="mt-8 lg:mt-10">
                <LicensePicker
                  beat={currentBeat}
                  selected={selectedOption?.type ?? "premium"}
                  onSelect={setSelectedLicense}
                  accent={accent}
                />
                {isInCart(currentBeat.id) && cartItem ? (
                  <p className="mt-4 text-[12px] text-[#6F6F69]">
                    In cart — {getLicenseDisplayLabel(cartItem.selectedLicense)}.
                  </p>
                ) : null}
                <Button
                  onClick={handleContinue}
                  disabled={currentBeat.sold === true || !selectedOption?.available}
                  className="mt-6 w-full h-12"
                >
                  {currentBeat.sold
                    ? "Sold"
                    : `Continue with ${shortLicenseLabel(selectedOption?.type ?? "premium")} · ${formatPrice(selectedOption?.price ?? 0)}`}
                </Button>
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-11 items-center text-[12px] text-[#999991] hover:text-foreground"
                  onClick={() => setShowPurchaseModal(true)}
                  disabled={currentBeat.sold === true}
                >
                  Buy now instead
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-16 max-w-xl">
            <p className="kfi-kicker">About this beat</p>
            <p className="mt-4 text-[15px] leading-7 text-[#6F6F69]">
              {currentBeat.title} is a {formatGenre(currentBeat.genre)} record
              {currentBeat.mood ? ` with a ${currentBeat.mood.toLowerCase()} feel` : ""}
              {currentBeat.key ? `, written in ${formatKey(currentBeat.key)}` : ""}.
              Listen first. License when it fits.
            </p>
          </div>

          <RelatedBeats beat={currentBeat} catalog={catalog} />
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

function TrackHeader({
  beat,
  isFavorite,
  onFavorite,
}: {
  beat: {
    id: string;
    title: string;
    genre: string;
    bpm: number;
    mood?: string;
    key?: string;
  };
  isFavorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="kfi-kicker hidden lg:block">{formatCatalogLabel(beat.id)}</p>
        <h1 className="mt-0 lg:mt-3 font-display text-[40px] leading-[1.02] tracking-display lg:text-5xl">
          {beat.title}
        </h1>
        <p className="mt-3 text-sm text-[#6F6F69]">
          {formatGenre(beat.genre)}
          {beat.mood ? ` / ${beat.mood}` : ""}
        </p>
        <p className="mt-2 text-[13px] tabular-nums text-[#999991]">
          {beat.bpm} BPM
          {beat.key ? ` · ${formatKey(beat.key)}` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={isFavorite ? "Remove from saved beats" : "Save beat"}
        onClick={onFavorite}
        className="mt-1 inline-flex h-11 w-11 items-center justify-center text-[#999991] hover:text-foreground"
      >
        <Heart className={`h-5 w-5 ${isFavorite ? "fill-current text-foreground" : ""}`} strokeWidth={1.7} />
      </button>
    </div>
  );
}
