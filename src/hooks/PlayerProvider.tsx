import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlayerContext, PlayerContextType, Track } from "./playerContext";
import { allSongs } from "@/data/allSongs";

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const playRandomRef = useRef<(() => void) | null>(null);

  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
    // Helps when streaming from other origins during dev
    audioRef.current.crossOrigin = "anonymous";
  }

  useEffect(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      // Auto-advance to a random next song when a track ends
      if (playRandomRef.current) playRandomRef.current();
    };
    const onError = () => {
      // Surface errors in dev console; keeps UI from silently failing
      const err =
        (audio.error && audio.error.message) || "Audio playback error";
      console.error("[player]", err, { src: audio.src });
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const play = useCallback(() => {
    if (audioRef.current && current) {
      const p = audioRef.current.play();
      if (p && typeof p.catch === "function") {
        p.catch((e) => {
          console.warn("[player] play() blocked or failed", e);
        });
      }
    }
  }, [current]);
  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);
  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);
  const setVolume = useCallback(
    (v: number) => setVolumeState(Math.max(0, Math.min(1, v))),
    []
  );
  const seek = useCallback(
    (t: number) => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.max(0, Math.min(duration, t));
    },
    [duration]
  );
  const playTrack = useCallback(
    (t: Track) => {
      const audio = audioRef.current!;
      if (!audio) return;
      // If it's a different track id or the URL changed (e.g., new signed URL), update the src
      if (!current || current.id !== t.id || current.audioUrl !== t.audioUrl) {
        audio.src = t.audioUrl;
        setCurrent(t);
      }
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch((e) => {
          console.warn("[player] playTrack() failed", e, { src: t.audioUrl });
        });
      }
    },
    [current]
  );

  const playRandom = useCallback(() => {
    if (!allSongs.length) return;
    const idx = Math.floor(Math.random() * allSongs.length);
    const song = allSongs[idx];
    playTrack({ id: song.id, title: song.title, audioUrl: song.audioUrl });
  }, [playTrack]);

  // Keep a stable reference to playRandom for event listeners
  useEffect(() => {
    playRandomRef.current = playRandom;
  }, [playRandom]);

  const value: PlayerContextType = useMemo(
    () => ({
      current,
      isPlaying,
      duration,
      currentTime,
      volume,
      play,
      pause,
      toggle,
      playRandom,
      setVolume,
      seek,
      playTrack,
    }),
    [
      current,
      isPlaying,
      duration,
      currentTime,
      volume,
      play,
      pause,
      toggle,
      playRandom,
      setVolume,
      seek,
      playTrack,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
