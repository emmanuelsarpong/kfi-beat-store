import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlayableUrlForBeat } from "@/lib/audio";
import { usePlayer } from "@/hooks/usePlayer";
import type { BeatData } from "@/data/beats";

type WaveformPlayerProps = {
  beat: BeatData;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

const PLAYER_EVENT = "kfi:waveform-play";

export default function WaveformPlayer({ beat }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { pause: pauseGlobalPlayer } = usePlayer();
  const [audioUrl, setAudioUrl] = useState(beat.previewUrl || beat.audioUrl || "");
  const [isResolving, setIsResolving] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const hoverTime = useMemo(() => {
    if (hoverRatio == null || duration <= 0) return null;
    return hoverRatio * duration;
  }, [duration, hoverRatio]);

  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
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

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      url: audioUrl,
      height: 152,
      normalize: true,
      cursorWidth: 2,
      cursorColor: "rgba(255,255,255,0.72)",
      waveColor: "rgba(255,255,255,0.12)",
      progressColor: "#f4b860",
      dragToSeek: true,
      interact: true,
      autoScroll: false,
      autoCenter: false,
      barWidth: undefined,
      barGap: undefined,
      barRadius: 0,
    });
    wavesurferRef.current = wavesurfer;

    const handleReady = () => {
      setDuration(wavesurfer.getDuration());
      setCurrentTime(wavesurfer.getCurrentTime());
      setIsReady(true);
      setIsResolving(false);
    };
    const handleTimeUpdate = (time: number) => {
      setCurrentTime(time);
    };
    const handlePlay = () => {
      pauseGlobalPlayer();
      window.dispatchEvent(
        new CustomEvent(PLAYER_EVENT, { detail: { beatId: beat.id } })
      );
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleFinish = () => {
      setIsPlaying(false);
      setCurrentTime(wavesurfer.getDuration());
    };
    const handleError = (error: unknown) => {
      console.error("[waveform] load failed", error);
      setIsResolving(false);
      setIsReady(false);
    };

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("timeupdate", handleTimeUpdate);
    wavesurfer.on("play", handlePlay);
    wavesurfer.on("pause", handlePause);
    wavesurfer.on("finish", handleFinish);
    wavesurfer.on("error", handleError);

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl, beat.id, pauseGlobalPlayer]);

  useEffect(() => {
    const handleExternalPlay = (event: Event) => {
      const customEvent = event as CustomEvent<{ beatId?: string }>;
      if (customEvent.detail?.beatId !== beat.id) {
        wavesurferRef.current?.pause();
      }
    };

    window.addEventListener(PLAYER_EVENT, handleExternalPlay as EventListener);
    return () => {
      window.removeEventListener(
        PLAYER_EVENT,
        handleExternalPlay as EventListener
      );
    };
  }, [beat.id]);

  useEffect(() => {
    return () => {
      wavesurferRef.current?.destroy();
    };
  }, []);

  const togglePlayback = async () => {
    try {
      await wavesurferRef.current?.playPause();
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
    <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_30px_100px_rgba(0,0,0,0.38)] overflow-hidden">
      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center sm:gap-6">
            <Button
              onClick={togglePlayback}
              disabled={isResolving || !audioUrl}
              aria-label={isPlaying ? "Pause beat preview" : "Play beat preview"}
              className="mx-auto sm:mx-0 h-[78px] w-[78px] rounded-full border border-amber-300/30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),rgba(255,255,255,0.06)),linear-gradient(135deg,#f4b860,#ef7d5f)] text-black shadow-[0_0_36px_rgba(244,184,96,0.22)] hover:scale-[1.03] hover:shadow-[0_0_42px_rgba(244,184,96,0.28)] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>

            <div className="min-w-0">
              <div
                ref={wrapperRef}
                className="group relative rounded-[28px] bg-black/28 px-1 py-2 transition-colors hover:bg-black/34"
                onMouseMove={(e) => updateHoverPosition(e.clientX)}
                onMouseLeave={() => setHoverRatio(null)}
                onTouchMove={(e) => {
                  if (e.touches[0]) updateHoverPosition(e.touches[0].clientX);
                }}
                onTouchEnd={() => setHoverRatio(null)}
              >
                {hoverRatio != null && (
                  <div
                    className="pointer-events-none absolute inset-y-2 z-20 w-px bg-white/40"
                    style={{ left: `${hoverRatio * 100}%` }}
                  />
                )}
                {hoverTime != null && (
                  <div
                    className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 rounded-full bg-white/10 px-2 py-1 text-[11px] text-zinc-200 backdrop-blur-sm"
                    style={{ left: `${hoverRatio! * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
                <div
                  ref={waveformRef}
                  className={`w-full cursor-pointer [&_canvas]:rounded-[18px] [&_wave]:transition-opacity ${
                    isReady ? "opacity-100" : "opacity-70"
                  }`}
                />
                {!isReady && (
                  <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03))] animate-pulse" />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-zinc-100 font-medium">
                  {formatTime(currentTime)}
                </div>
                <div className="text-zinc-500">
                  {isResolving ? "Loading preview..." : "Preview"}
                </div>
                <div className="text-zinc-400">{formatTime(duration)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
