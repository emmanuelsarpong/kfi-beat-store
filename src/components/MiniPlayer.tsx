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

const MiniPlayer: React.FC = () => {
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

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[92%] sm:w-[420px] bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl">
      <div className="grid grid-cols-[48px_1fr] gap-3 px-4 py-3">
        {/* Cover */}
        <img
          src={current?.coverImage || "/placeholder.svg"}
          className="w-12 h-12 rounded-md object-cover col-span-1 row-span-3"
          alt="cover"
        />

        {/* Line 1: title */}
        <div className="col-span-1 min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {current?.title || "Nothing playing"}
          </div>
        </div>

        {/* Line 2: progress */}
        <div className="col-span-1 flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="tabular-nums w-10 text-right">
            {format(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-white/90"
            aria-label="Seek"
            title="Seek"
          />
          <span className="tabular-nums w-10 text-left">
            {format(duration)}
          </span>
        </div>

        {/* Line 3: controls */}
        <div className="col-span-1 flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => jump(-10)}
              className="w-9 h-9 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 border border-white/10"
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={() => jump(10)}
              className="w-9 h-9 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 border border-white/10"
              aria-label="Forward 10 seconds"
              title="Forward 10s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Volume2 className="w-4 h-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 sm:w-24 accent-white/90"
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
