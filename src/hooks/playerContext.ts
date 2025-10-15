import { createContext } from "react";

export type Track = {
  id?: string;
  title: string;
  audioUrl: string;
  coverImage?: string;
};

export type PlayerContextType = {
  current?: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  playRandom: () => void;
  setVolume: (v: number) => void;
  seek: (t: number) => void;
  playTrack: (t: Track) => void;
};

export const PlayerContext = createContext<PlayerContextType | undefined>(
  undefined
);
