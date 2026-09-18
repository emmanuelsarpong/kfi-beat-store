import type { BeatData } from "@/data/beats";
import { MIN_LICENSE_PRICE_DISPLAY } from "@/config/licenses";

export function formatCatalogId(id: string) {
  const numeric = String(id).replace(/\D/g, "");
  if (!numeric) return String(id).padStart(3, "0");
  return numeric.padStart(3, "0");
}

export function formatCatalogLabel(id: string) {
  return `KFI / BEAT ${formatCatalogId(id)}`;
}

export function formatGenre(genre?: string) {
  if (!genre) return "";
  return genre
    .replace(/\bRnB\b/gi, "R&B")
    .replace(/\bRnb\b/g, "R&B")
    .replace(/\bHip Hop\b/gi, "Hip Hop")
    .replace(/\bAfro-Soca\b/gi, "Afro-Soca");
}

export function formatKey(key?: string) {
  if (!key) return "";
  return key.replace(/\s+/g, " ").toUpperCase();
}

export function formatPrice(amount: number) {
  if (!Number.isFinite(amount)) return "$0";
  return `$${Math.round(amount)}`;
}

export function startingPriceLabel() {
  return `From ${formatPrice(MIN_LICENSE_PRICE_DISPLAY)}`;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export type EditorialGenre = {
  id: string;
  label: string;
  match: (genre: string) => boolean;
};

export const EDITORIAL_GENRES: EditorialGenre[] = [
  {
    id: "afrobeats",
    label: "Afrobeats",
    match: (genre) => /afrobeat/i.test(genre) && !/soca|house/i.test(genre),
  },
  {
    id: "rnb",
    label: "R&B",
    match: (genre) => /rnb|r&b/i.test(genre),
  },
  {
    id: "amapiano",
    label: "Amapiano",
    match: (genre) => /amapiano/i.test(genre),
  },
  {
    id: "soca",
    label: "Soca",
    match: (genre) => /soca/i.test(genre),
  },
  {
    id: "trap",
    label: "Trap",
    match: (genre) => /trap/i.test(genre) && !/rnb|r&b/i.test(genre),
  },
  {
    id: "house",
    label: "House",
    match: (genre) => /house/i.test(genre),
  },
  {
    id: "hiphop",
    label: "Hip Hop",
    match: (genre) => /hip\s*hop|boom\s*bap/i.test(genre),
  },
];

export function matchesEditorialGenre(genre: string, genreId: string) {
  if (!genreId) return true;
  const group = EDITORIAL_GENRES.find((item) => item.id === genreId);
  if (group) return group.match(genre);
  return genre === genreId;
}

export function getRelatedBeats(beat: BeatData, catalog: BeatData[], limit = 3) {
  return catalog
    .filter((candidate) => candidate.id !== beat.id && candidate.sold !== true)
    .map((candidate) => {
      let score = 0;
      if (candidate.genre === beat.genre) score += 6;
      else if (
        EDITORIAL_GENRES.some(
          (group) => group.match(candidate.genre) && group.match(beat.genre)
        )
      ) {
        score += 3;
      }
      if (candidate.mood && candidate.mood === beat.mood) score += 3;
      if (beat.key && candidate.key && formatKey(candidate.key) === formatKey(beat.key)) {
        score += 2;
      }
      const bpmDelta = Math.abs(candidate.bpm - beat.bpm);
      if (bpmDelta <= 6) score += 3;
      else if (bpmDelta <= 12) score += 2;
      else if (bpmDelta <= 20) score += 1;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.candidate.id) - Number(a.candidate.id))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
