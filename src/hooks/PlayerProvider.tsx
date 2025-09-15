import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlayerContext, PlayerContextType, Track } from "./playerContext";

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);

  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  useEffect(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const play = useCallback(() => {
    if (audioRef.current && current) audioRef.current.play();
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
      if (!current || current.audioUrl !== t.audioUrl) {
        audio.src = t.audioUrl;
        setCurrent(t);
      }
      audio.play();
    },
    [current]
  );

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
      setVolume,
      seek,
      playTrack,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
