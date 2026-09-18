import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Pause, Play } from "lucide-react";
import { getPlayableUrlForBeat } from "@/lib/audio";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/catalog";
import { getAccentColor } from "@/lib/artwork";
import type { BeatData } from "@/data/beats";

type WaveformPlayerProps = {
  beat: BeatData;
};

export default function WaveformPlayer({ beat }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const {
    current,
    isPlaying: globalIsPlaying,
    currentTime: globalCurrentTime,
    duration: globalDuration,
    toggle,
    seek,
    playTrack,
  } = usePlayer();
  const [audioUrl, setAudioUrl] = useState(beat.previewUrl || beat.audioUrl || "");
  const [isResolving, setIsResolving] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const isCurrent = current?.id === beat.id;
  const isPlaying = isCurrent && globalIsPlaying;
  const currentTime = isCurrent ? globalCurrentTime : 0;
  const duration = isCurrent ? globalDuration || localDuration : localDuration;
  const accent = getAccentColor(beat);
  const hoverTime = useMemo(() => {
    if (hoverRatio == null || duration <= 0) return null;
    return hoverRatio * duration;
  }, [duration, hoverRatio]);

  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);
    setIsReady(false);
    setLocalDuration(0);
    setAudioUrl(beat.previewUrl || beat.audioUrl || "");

    getPlayableUrlForBeat({
      id: beat.id,
      title: beat.title,
      previewUrl: beat.previewUrl,
      audioUrl: beat.audioUrl,
    })
      .then((url) => {
        if (!cancelled && url) setAudioUrl(url);
      })
      .catch((error) => {
        console.error("[waveform] failed to resolve preview URL", error);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [beat.audioUrl, beat.id, beat.previewUrl, beat.title]);

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    const height = window.matchMedia("(min-width: 1024px)").matches ? 88 : 56;
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      url: audioUrl,
      height,
      normalize: true,
      cursorWidth: 1,
      cursorColor: "rgba(17,17,17,0.45)",
      waveColor: "rgba(17,17,17,0.16)",
      progressColor: accent,
      dragToSeek: true,
      interact: true,
      autoScroll: false,
      autoCenter: false,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
    });
    wavesurferRef.current = wavesurfer;

    const handleReady = () => {
      setLocalDuration(wavesurfer.getDuration());
      setIsReady(true);
      setIsResolving(false);
    };
    const handleError = (error: unknown) => {
      console.error("[waveform] load failed", error);
      setIsResolving(false);
      setIsReady(false);
    };
    const startGlobalPlayback = (startAt?: number) => {
      playTrack({
        id: beat.id,
        title: beat.title,
        audioUrl,
        coverImage: beat.coverImage,
      });
      if (typeof startAt === "number" && Number.isFinite(startAt)) {
        window.setTimeout(() => seek(startAt), 0);
      }
    };

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("play", () => {
      const time = wavesurfer.getCurrentTime();
      wavesurfer.pause();
      if (!isCurrent || !globalIsPlaying) startGlobalPlayback(time);
    });
    wavesurfer.on("interaction", (time: number) => {
      if (isCurrent) {
        seek(time);
        return;
      }
      startGlobalPlayback(time);
    });
    wavesurfer.on("error", handleError);

    return () => {
      wavesurfer.pause();
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [
    accent,
    audioUrl,
    beat.coverImage,
    beat.id,
    beat.title,
    globalIsPlaying,
    isCurrent,
    playTrack,
    seek,
  ]);

  useEffect(() => {
    if (!isCurrent) return;
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;
    if (ws.isPlaying()) ws.pause();
    const wsTime = ws.getCurrentTime();
    if (Math.abs(wsTime - globalCurrentTime) > 0.15) {
      ws.setTime(globalCurrentTime);
    }
  }, [globalCurrentTime, isCurrent, isReady]);

  const togglePlayback = async () => {
    if (!audioUrl) return;
    try {
      if (isCurrent) {
        toggle();
        return;
      }
      playTrack({
        id: beat.id,
        title: beat.title,
        audioUrl,
        coverImage: beat.coverImage,
      });
    } catch (error) {
      console.error("[waveform] play failed", error);
    }
  };

  const updateHoverPosition = (clientX: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    setHoverRatio(Math.min(1, Math.max(0, ratio)));
  };

  return (
    <div className="pt-2">
      <div
        ref={wrapperRef}
        className="relative overflow-x-clip"
        onMouseMove={(e) => updateHoverPosition(e.clientX)}
        onMouseLeave={() => setHoverRatio(null)}
        onTouchMove={(e) => {
          if (e.touches[0]) updateHoverPosition(e.touches[0].clientX);
        }}
        onTouchEnd={() => setHoverRatio(null)}
      >
        {hoverTime != null && (
          <div
            className="pointer-events-none absolute -top-6 z-20 -translate-x-1/2 text-[11px] tabular-nums text-[#6F6F69]"
            style={{ left: `${hoverRatio! * 100}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
        <div
          ref={waveformRef}
          className={`w-full cursor-pointer ${isReady ? "opacity-100" : "opacity-60"}`}
        />
        {!isReady && (
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/[0.03] animate-pulse" />
        )}
      </div>
      <div className="mt-4 hidden items-center justify-between lg:flex">
        <span className="text-[12px] tabular-nums text-[#999991]">{formatTime(currentTime)}</span>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={isResolving || !audioUrl}
          aria-label={isPlaying ? "Pause beat preview" : "Play beat preview"}
          className="inline-flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <span className="text-[12px] tabular-nums text-[#999991]">{formatTime(duration)}</span>
      </div>
      <div className="mt-4 lg:hidden">
        <div className="flex items-center justify-between">
          <span className="text-[13px] tabular-nums text-[#999991]">{formatTime(currentTime)}</span>
          <span className="text-[13px] tabular-nums text-[#999991]">{formatTime(duration)}</span>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={isResolving || !audioUrl}
          aria-label={isPlaying ? "Pause beat preview" : "Play beat preview"}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm text-background disabled:opacity-50"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
