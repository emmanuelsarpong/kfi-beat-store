import { useCallback } from "react";
import { usePlayerStore } from "./playerStore";

// Compatibility hook: returns an object similar to the previous context-based API
export const usePlayer = () => {
  const current = usePlayerStore((s) => {
    const id = s.id;
    return id ? { id, title: s.title ?? undefined, audioUrl: s.src } : null;
  });
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const volume = usePlayerStore((s) => s.volume);
  const playById = usePlayerStore((s) => s.playById);
  const pause = usePlayerStore((s) => s.pause);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const seek = usePlayerStore((s) => s.seek);
  const next = usePlayerStore((s) => s.next);

  const playTrack = useCallback(
    (t: { id?: string; title?: string; audioUrl: string }) => {
      if (t.id) playById(t.id, t.audioUrl, t.title);
      else playById("", t.audioUrl, t.title);
    },
    [playById]
  );

  const play = useCallback(() => {
    // if there's a current id, set playing true; else noop
    const id = usePlayerStore.getState().id;
    if (id) usePlayerStore.setState({ isPlaying: true });
  }, []);

  const toggle = useCallback(() => {
    const s = usePlayerStore.getState();
    usePlayerStore.setState({ isPlaying: !s.isPlaying });
  }, []);

  return {
    current,
    isPlaying,
    duration,
    currentTime,
    volume,
    play: play,
    pause,
    toggle,
    setVolume,
    seek,
    playTrack,
    playRandom: () => next(),
  } as const;
};
