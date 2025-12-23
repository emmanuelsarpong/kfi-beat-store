import React from "react";
import { usePlayer } from "@/hooks/usePlayer";
import {
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  Shuffle,
} from "lucide-react";

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
    playRandom,
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
        {/* Cover / Placeholder */}
        <div className="w-8 h-8 rounded-md overflow-hidden col-span-1 row-span-3 bg-zinc-800/60 flex items-center justify-center">
          {current?.coverImage ? (
            <img
              src={current.coverImage}
              className="w-full h-full object-cover"
              alt={current.title}
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center gap-[2px]">
              <span className="block w-[3px] h-3 rounded-sm bg-zinc-500/70 animate-waveform [animation-delay:0s]" />
              <span className="block w-[3px] h-4 rounded-sm bg-zinc-500/70 animate-waveform [animation-delay:0.12s]" />
              <span className="block w-[3px] h-5 rounded-sm bg-zinc-500/70 animate-waveform [animation-delay:0.24s]" />
              <span className="block w-[3px] h-4 rounded-sm bg-zinc-500/70 animate-waveform [animation-delay:0.36s]" />
            </div>
          )}
        </div>

        {/* Line 1: title */}
        <div className="col-span-1 min-w-0">
          <div className="truncate text-[11px] md:text-sm font-semibold text-white flex items-center gap-1.5">
            {current?.title || "Idle • Select a beat"}
            {isPlaying && (
              <span className="kfi-mini-wave" aria-hidden>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
            )}
            {!current && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-800/70 border border-white/5 tracking-wide font-normal text-zinc-400">
                READY
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
              onClick={() => playRandom([])}
              className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/15 border border-white/10"
              aria-label="Shuffle Play"
              title="Shuffle Play"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => jump(-10)}
              className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/15 border border-white/10"
              aria-label="Rewind 10 seconds"
              title="Rewind 10s"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => (current ? toggle() : playRandom([]))}
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
              onClick={() => playRandom([])}
              className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/15 border border-white/10"
              aria-label="Next (Random)"
              title="Next (Random)"
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
