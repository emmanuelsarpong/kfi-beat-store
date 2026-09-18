import { useEffect, useMemo, useRef } from "react";
import { Heart, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import BeatArtwork from "@/components/BeatArtwork";
import { beats } from "@/data/beats";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/catalog";
import { getBeatHref } from "@/lib/beatSlugs";
import { cn } from "@/lib/utils";

const MiniPlayer = () => {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    toggle,
    seek,
    volume,
    setVolume,
    next,
    previous,
  } = usePlayer();
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const dockRef = useRef<HTMLDivElement>(null);

  const beat = useMemo(
    () => (current?.id ? beats.find((item) => item.id === current.id) : null),
    [current?.id]
  );

  useEffect(() => {
    if (!current) {
      document.documentElement.style.setProperty("--player-h", "0px");
      return;
    }
    const el = dockRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--player-h",
        `${el.offsetHeight + 16}px`
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      document.documentElement.style.setProperty("--player-h", "0px");
    };
  }, [current]);

  if (!current || !beat) return null;

  const favActive = isFavorite(beat.id);

  const renderFavorite = (mobile: boolean) => (
    <button
      type="button"
      onClick={() =>
        toggleFav({
          id: beat.id,
          title: beat.title,
          coverImage: beat.coverImage,
          genre: beat.genre,
          bpm: beat.bpm,
        })
      }
      className={cn(
        "inline-flex items-center justify-center",
        mobile ? "h-11 w-11" : "h-8 w-8",
        favActive ? "text-foreground" : "text-[#999991] hover:text-foreground"
      )}
      aria-label={favActive ? "Remove from saved beats" : "Save beat"}
    >
      <Heart className={cn("h-4 w-4", favActive && "fill-current")} strokeWidth={1.7} />
    </button>
  );

  return (
    <div
      ref={dockRef}
      className="fixed inset-x-3 z-40 bottom-[max(0.75rem,env(safe-area-inset-bottom))] lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:bottom-3 lg:w-[min(760px,calc(100vw-2rem))]"
    >
      <div className="rounded-[18px] border border-black/[0.08] bg-white/86 backdrop-blur-xl shadow-dock px-3 py-2.5 lg:px-4 lg:py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5 pr-2">
            <Link to={getBeatHref(beat)} className="shrink-0">
              <BeatArtwork
                beat={beat}
                playing={isPlaying}
                compact
                className="h-12 w-12 rounded-[10px]"
              />
            </Link>
            <div className="min-w-0">
              <Link
                to={getBeatHref(beat)}
                className="block truncate text-sm font-medium tracking-display"
              >
                {beat.title}
              </Link>
              <p className="truncate text-[11px] uppercase tracking-[0.16em] text-[#999991]">KFI</p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => previous()}
              className="inline-flex h-11 w-11 items-center justify-center text-[#6F6F69]"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toggle()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => next()}
              className="inline-flex h-11 w-11 items-center justify-center text-[#6F6F69]"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-end">{renderFavorite(true)}</div>
        </div>

        <div className="mt-1.5 flex items-center gap-3 lg:hidden">
          <span className="w-8 text-[11px] tabular-nums text-[#999991]">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="player-range w-full"
            aria-label="Seek"
          />
          <span className="w-8 text-right text-[11px] tabular-nums text-[#999991]">
            {formatTime(duration)}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to={getBeatHref(beat)} className="shrink-0">
            <BeatArtwork
              beat={beat}
              playing={isPlaying}
              compact
              className="h-14 w-14 rounded-[10px]"
            />
          </Link>

          <div className="min-w-0 w-40">
            <Link
              to={getBeatHref(beat)}
              className="block truncate text-sm font-medium tracking-display"
            >
              {beat.title}
            </Link>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#999991]">KFI</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => previous()}
              className="inline-flex h-8 w-8 items-center justify-center text-[#6F6F69] hover:text-foreground"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toggle()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => next()}
              className="inline-flex h-8 w-8 items-center justify-center text-[#6F6F69] hover:text-foreground"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-8 text-right text-[11px] tabular-nums text-[#999991]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              className="player-range w-full"
              aria-label="Seek"
            />
            <span className="w-8 text-[11px] tabular-nums text-[#999991]">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center">
            {renderFavorite(false)}
            <div className="flex items-center gap-2 text-[#6F6F69]">
              <Volume2 className="h-3.5 w-3.5" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="player-range w-16"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
