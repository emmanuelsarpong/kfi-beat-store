import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Play } from "lucide-react";
import BeatArtwork from "@/components/BeatArtwork";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/hooks/usePlayer";
import { beats as seedBeats } from "@/data/beats";
import { startBeatPlayback } from "@/lib/playBeat";
import { formatGenre, formatKey } from "@/lib/catalog";
import { getAccentColor } from "@/lib/artwork";
import { getBeatHref } from "@/lib/beatSlugs";

const HeroSection = () => {
  const navigate = useNavigate();
  const { beats } = useBeats();
  const { current, isPlaying, playTrack, toggle } = usePlayer();
  const latest = useMemo(() => {
    return [...(beats ?? seedBeats)].sort((a, b) => Number(b.id) - Number(a.id))[0];
  }, [beats]);

  const playingLatest = current?.id === latest?.id && isPlaying;
  const accent = latest ? getAccentColor(latest) : "#111111";

  const playLatest = () => {
    if (!latest) return;
    if (current?.id === latest.id) {
      toggle();
      return;
    }
    startBeatPlayback(latest, playTrack).catch((error) => {
      console.error("[player] failed to play latest", error);
    });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-10 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end">
          <div className="lg:col-span-7">
            <p className="kfi-kicker reveal">KFI / PRODUCER</p>
            <h1 className="mt-5 lg:mt-6 font-display text-[48px] sm:text-[56px] md:text-[64px] lg:text-[84px] leading-[0.94] lg:leading-[0.92] tracking-[-0.05em] reveal">
              Sound with
              <br />
              a point of view.
            </h1>
            <p className="mt-6 lg:mt-8 max-w-md text-[16px] leading-7 text-[#6F6F69] reveal">
              Premium production for artists building records worth replaying.
            </p>
            <div className="mt-8 lg:mt-10 flex flex-wrap items-center gap-6 reveal">
              <button
                type="button"
                onClick={() => navigate("/store")}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"
              >
                Explore beats
                <span aria-hidden>→</span>
              </button>
              <button
                type="button"
                onClick={playLatest}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-[#6F6F69] hover:text-foreground"
              >
                <span className="inline-flex h-10 w-10 lg:h-8 lg:w-8 items-center justify-center rounded-full border border-black/[0.08]">
                  {playingLatest ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 ml-px" />
                  )}
                </span>
                {playingLatest ? "Pause latest" : "Play latest"}
              </button>
            </div>
          </div>

          {latest ? (
            <div className="lg:col-span-5 lg:pl-6 reveal">
              <div
                className="relative rounded-[20px] p-3 sm:p-4 lg:p-5"
                style={{ background: `${accent}14` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                  <div className="relative w-full lg:w-[46%] lg:max-w-[220px] shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(getBeatHref(latest))}
                      className="w-full"
                    >
                      <BeatArtwork
                        beat={latest}
                        playing={playingLatest}
                        priority
                        className="aspect-square w-full rounded-[14px]"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={playLatest}
                      className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft backdrop-blur-sm lg:hidden"
                      aria-label={playingLatest ? "Pause latest" : "Play latest"}
                    >
                      {playingLatest ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="kfi-kicker">Current release</p>
                    <h2 className="mt-3 font-display text-3xl tracking-display">
                      {latest.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#6F6F69]">
                      {formatGenre(latest.genre)}
                    </p>
                    <p className="mt-3 text-[13px] lg:text-[12px] tabular-nums text-[#999991]">
                      {latest.bpm} BPM
                      {latest.key ? ` · ${formatKey(latest.key)}` : ""}
                    </p>
                    <div className="mt-5 hero-eq text-foreground/70 hidden lg:flex" style={{ color: accent }}>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
