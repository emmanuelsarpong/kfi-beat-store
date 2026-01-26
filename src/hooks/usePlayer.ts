import { useCallback } from "react";
import { usePlayerStore } from "./playerStore";
import { allSongs } from "@/data/allSongs";

// Compatibility hook: returns an object similar to the previous context-based API
export const usePlayer = () => {
  const current = usePlayerStore((s) => {
    const id = s.id;
    return id
      ? {
          id,
          title: s.title ?? undefined,
          audioUrl: s.src,
          coverImage: s.coverImage ?? undefined,
        }
      : null;
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
  const setQueue = usePlayerStore((s) => s.setQueue);
  const previous = usePlayerStore((s) => s.previous);

  const playTrack = useCallback(
    (t: {
      id?: string;
      title?: string;
      audioUrl: string;
      coverImage?: string;
    }) => {
      if (t.id) playById(t.id, t.audioUrl, t.title, t.coverImage);
      else playById("", t.audioUrl, t.title, t.coverImage);
    },
    [playById],
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

  const playRandom = useCallback(
    (songList?: { id: string; audioUrl: string; title?: string }[]) => {
      // Use provided list, or default to all songs
      const availableSongs =
        songList && songList.length > 0 ? songList : allSongs;

      if (!availableSongs.length) {
        console.warn("No songs available to play");
        return;
      }

      // Shuffle the array
      const shuffled = [...availableSongs].sort(() => Math.random() - 0.5);

      if (shuffled.length === 0) return;

      // Set the first song to play and rest as queue
      const [first, ...rest] = shuffled;
      setQueue(rest.map((s) => s.id));
      playById(first.id, first.audioUrl, first.title);
    },
    [playById, setQueue],
  );

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
    playRandom,
    next,
    previous,
  } as const;
};
