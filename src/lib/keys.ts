export type NormalizedKey = { note: string; quality: "Maj" | "min" };

export function normalizeKey(str?: string | null): NormalizedKey | null {
  if (!str) return null;
  const m = String(str)
    .trim()
    .match(/^([A-G](?:#|b)?)[\s-]*(Maj|Major|min|Minor)$/i);
  if (!m) return null;
  let note = m[1];
  const qual: NormalizedKey["quality"] = /maj(or)?/i.test(m[2]) ? "Maj" : "min";
  const enharm: Record<string, string> = {
    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#",
  };
  if (enharm[note]) note = enharm[note];
  return { note, quality: qual };
}

export type KeyFilterValue = {
  note: string | null;
  quality: "Maj" | "min" | null;
};

export function keyMatches(filter: KeyFilterValue, beatKey?: string): boolean {
  if (!filter.note) return true;
  const n = normalizeKey(beatKey);
  if (!n) return false;
  const enharm: Record<string, string> = {
    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#",
  };
  const note = enharm[filter.note] || filter.note;
  if (n.note !== note) return false;
  if (!filter.quality) return true;
  return n.quality === filter.quality;
}
