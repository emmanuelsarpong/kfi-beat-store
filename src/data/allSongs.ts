import { beats } from "./beats";

export type Song = {
  id: string;
  title: string;
  audioUrl: string;
};

// Only include real, playable beats (exclude placeholders like "/api/placeholder-audio").
// This ensures shuffle/auto-next only uses tracks that exist in Supabase now.
const isPlayable = (audioUrl: string | undefined) =>
  !!audioUrl && audioUrl !== "/api/placeholder-audio";

// Derived list of playable songs. Auto-updates when `beats` changes.
export const allSongs: Song[] = beats
  .filter((b) => isPlayable(b.audioUrl))
  .map((b) => ({ id: b.id, title: b.title, audioUrl: b.audioUrl }));
