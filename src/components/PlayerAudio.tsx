import React, { useEffect, useRef } from "react";
import { usePlayerStore, getPlayToken } from "@/hooks/playerStore";

export default function PlayerAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const src = usePlayerStore((s) => s.src);
  const volume = usePlayerStore((s) => s.volume);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seekTime = usePlayerStore((s) => s.seekTime);
  const onEnded = usePlayerStore((s) => s._onEnded);
  const onTime = usePlayerStore((s) => s._onTime);
  const onCanPlay = usePlayerStore((s) => s._onCanPlay);
  const currentId = usePlayerStore((s) => s.currentId);

  // attach once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    const handleEnded = () => onEnded(currentId());
    const handleTime = () => onTime(audio.currentTime, audio.duration);
    const handleCanPlay = () => onCanPlay();

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTime, { passive: true } as any);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      try {
        audio.pause();
      } catch (e) {
        /* ignore */
      }
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTime as any);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [onEnded, onTime, onCanPlay, currentId]);

  // drive imperative changes: src
  useEffect(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    if (audio.src !== (src || "")) {
      // stop any other audio elements (hover previews)
      try {
        document.querySelectorAll("audio").forEach((el) => {
          if (el !== audio) {
            try {
              el.pause();
              el.currentTime = 0;
            } catch (e) {
              /* ignore */
            }
          }
        });
      } catch (e) {
        /* ignore */
      }

      try {
        audio.pause();
      } catch (e) {
        /* ignore */
      }
      audio.src = src || "";
      audio.currentTime = 0;
      if (src) {
        try {
          audio.load();
        } catch (e) {
          /* ignore */
        }
      }
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    if (!src) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, src]);

  useEffect(() => {
    const audio = audioRef.current!;
    if (!audio || seekTime === null) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, seekTime));
    usePlayerStore.setState({ seekTime: null, currentTime: seekTime });
  }, [seekTime]);

  return null;
}
