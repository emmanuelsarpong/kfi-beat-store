import React from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { Play, Pause, Volume2, SkipBack, SkipForward } from "lucide-react";

const format = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${r}`;
};

type MiniPlayerProps = {
  mode?: "floating" | "footer";
};

const MiniPlayer: React.FC<MiniPlayerProps> = ({ mode = "floating" }) => {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    toggle,
    seek,
    volume,
    setVolume,
  } = usePlayer();

  const jump = React.useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(currentTime + delta, 0), duration || 0);
      seek(next);
    },
    [currentTime, duration, seek]
  );

  const containerClass =
    mode === "floating"
      ? "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] sm:w-[500px] bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl"
      : "relative w-full max-w-[660px] mx-auto bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-md transition-all duration-300";

  return (
    <div className={containerClass}>
      <div className="grid grid-cols-[34px_1fr] gap-3 px-3 py-1.5">
        {/* Cover */}
        <img
          src={current?.coverImage || "/placeholder.svg"}
          className="w-8 h-8 rounded-md object-cover col-span-1 row-span-3"
          alt="cover"
        />

        {/* Line 1: title */}
        <div className="col-span-1 min-w-0">
          <div className="truncate text-[11px] md:text-sm font-semibold text-white flex items-center gap-1.5">
            {current?.title || "Nothing playing"}
            {isPlaying && (
              <span className="kfi-mini-wave" aria-hidden>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            )}
          </div>
        </div>

        {/* Line 2: progress */}
        <div className="col-span-1 flex items-center gap-2 text-[10px] md:text-[11px] text-zinc-400">
          <span className="tabular-nums w-8 md:w-9 text-right">
            {format(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-white/90 h-1"
            aria-label="Seek"
            title="Seek"
          />
          <span className="tabular-nums w-8 md:w-9 text-left">
            {format(duration)}
          </span>
        </div>

        {/* Line 3: controls */}
        <div className="col-span-1 flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => jump(-10)}
              className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/15 border border-white/10"
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-md"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4.5 h-4.5" />
              ) : (
                <Play className="w-4.5 h-4.5 ml-0.5" />
              )}
            </button>
            <button
              onClick={() => jump(10)}
              className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/15 border border-white/10"
              aria-label="Forward 10 seconds"
              title="Forward 10s"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Volume2 className="w-3.5 h-3.5" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 sm:w-24 accent-white/90 hover:brightness-110 h-1"
              aria-label="Volume"
              title="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
