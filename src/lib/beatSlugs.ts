import type { BeatData } from "@/data/beats";

function slugifyPart(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBeatSlug(beat: Pick<BeatData, "id" | "title">) {
  const titleSlug = slugifyPart(beat.title);
  return titleSlug ? `${titleSlug}-${beat.id}` : String(beat.id);
}

export function getBeatHref(beat: Pick<BeatData, "id" | "title">) {
  return `/beats/${getBeatSlug(beat)}`;
}

export function matchesBeatSlug(
  beat: Pick<BeatData, "id" | "title">,
  candidate: string | undefined
) {
  if (!candidate) return false;
  const normalized = slugifyPart(candidate);
  return (
    normalized === slugifyPart(getBeatSlug(beat)) ||
    normalized === slugifyPart(beat.title) ||
    normalized === slugifyPart(String(beat.id))
  );
}

export function findBeatBySlug<T extends Pick<BeatData, "id" | "title">>(
  beats: T[],
  slug: string | undefined
) {
  return beats.find((beat) => matchesBeatSlug(beat, slug));
}
