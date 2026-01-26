import create from "zustand";
import { allSongs } from "@/data/allSongs";

type State = {
  // accessors
  currentId: () => string | null;
  id: string | null;
  title: string | null;
  src: string | null;
  coverImage: string | null;
  isPlaying: boolean;
  volume: number;
  queue: string[];
  progressById: Record<string, number>;
  duration: number;
  currentTime: number;
  seekTime: number | null;
  // internal callbacks wired by PlayerAudio
  _onEnded: (idAtEvent: string | null) => void;
  _onTime: (t: number, d: number) => void;
  _onCanPlay: () => void;
  // public API
  playById: (
    id: string,
    url: string,
    title?: string,
    coverImage?: string,
  ) => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
  seek: (t: number) => void;
  setQueue: (q: string[]) => void;
};

let playToken = 0;
export const getPlayToken = () => playToken;

function resolveUrl(id: string) {
  // Look up the actual URL from allSongs
  const song = allSongs.find((s) => s.id === id);
  if (song) return song.audioUrl;
  // Fallback resolver: map id to known catalog, or return a sensible path.
  return `/audio/${id}.mp3`;
}

function resolveTitle(id: string) {
  // Look up the title from allSongs
  const song = allSongs.find((s) => s.id === id);
  return song?.title ?? null;
}

export const usePlayerStore = create<State>((set, get) => ({
  currentId: () => get().id,
  id: null,
  title: null,
  src: null,
  coverImage: null,
  isPlaying: false,
  volume: 0.9,
  queue: [],
  progressById: {},
  duration: 0,
  currentTime: 0,
  seekTime: null,
  _onEnded: (idAtEvent) => {
    if (idAtEvent !== get().id) return;
    get().next();
  },
  _onTime: (t, d) => {
    const id = get().id;
    if (!id || !d) return;
    set((s) => {
      const prev = s.progressById[id];
      const nextVal = t / d;
      if (prev !== undefined && Math.abs(prev - nextVal) < 0.001) return s;
      return {
        ...s,
        progressById: { ...s.progressById, [id]: nextVal },
      } as any;
    });
    set({ currentTime: t, duration: d });
  },
  _onCanPlay: () => set({ isPlaying: true }),
  playById: (id, url, title, coverImage) => {
    playToken++;
    set({
      id,
      src: url,
      title: title ?? null,
      coverImage: coverImage ?? null,
      isPlaying: true,
    });
  },
  pause: () => set({ isPlaying: false }),
  next: () => {
    const { queue } = get();
    if (!queue.length) {
      // No queue, just stop playback
      set({ isPlaying: false });
      return;
    }
    const [nextId, ...rest] = queue;
    const nextUrl = resolveUrl(nextId);
    const nextTitle = resolveTitle(nextId);
    playToken++;
    set({
      id: nextId,
      src: nextUrl,
      title: nextTitle,
      queue: rest,
      isPlaying: true,
    });
  },
  previous: () => {
    // To support previous, we need to keep a history. For now, just restart the current song.
    // Optionally, you could implement a history stack for true previous track support.
    const { id } = get();
    if (!id) return;
    const url = resolveUrl(id);
    const title = resolveTitle(id);
    playToken++;
    set({
      src: url,
      title: title,
      currentTime: 0,
      seekTime: 0,
      isPlaying: true,
    });
  },
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  seek: (t) => set({ seekTime: t }),
  setQueue: (q) => set({ queue: q }),
}));
