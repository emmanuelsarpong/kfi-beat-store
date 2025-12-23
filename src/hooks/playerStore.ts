import create from "zustand";

type State = {
  // accessors
  currentId: () => string | null;
  id: string | null;
  title: string | null;
  src: string | null;
  isPlaying: boolean;
  volume: number;
  queue: string[];
  progressById: Record<string, number>;
  duration: number;
  currentTime: number;
  // internal callbacks wired by PlayerAudio
  _onEnded: (idAtEvent: string | null) => void;
  _onTime: (t: number, d: number) => void;
  _onCanPlay: () => void;
  // public API
  playById: (id: string, url: string, title?: string) => void;
  pause: () => void;
  next: () => void;
  setVolume: (v: number) => void;
  seek: (t: number) => void;
  setQueue: (q: string[]) => void;
};

let playToken = 0;
export const getPlayToken = () => playToken;

export const usePlayerStore = create<State>((set, get) => ({
  currentId: () => get().id,
  id: null,
  title: null,
  src: null,
  isPlaying: false,
  volume: 0.9,
  queue: [],
  progressById: {},
  duration: 0,
  currentTime: 0,
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
  playById: (id, url, title) => {
    playToken++;
    set({ id, src: url, title: title ?? null, isPlaying: true });
  },
  pause: () => set({ isPlaying: false }),
  next: () => {
    const { queue } = get();
    if (!queue.length) return set({ isPlaying: false });
    const [nextId, ...rest] = queue;
    const nextUrl = resolveUrl(nextId);
    playToken++;
    set({
      id: nextId,
      src: nextUrl,
      title: null,
      queue: rest,
      isPlaying: true,
    });
  },
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  seek: (t) => set({ currentTime: t }),
  setQueue: (q) => set({ queue: q }),
}));

function resolveUrl(id: string) {
  // Fallback resolver: map id to known catalog, or return a sensible path.
  return `/audio/${id}.mp3`;
}
