import { beats, type BeatData } from "@/data/beats";

export type CoverPattern =
  | "arcs"
  | "bars"
  | "rings"
  | "split"
  | "type"
  | "grid"
  | "bands"
  | "orbits"
  | "wave"
  | "stack"
  | "field"
  | "slash"
  | "pulse"
  | "frame"
  | "dots"
  | "rise"
  | "crescent"
  | "cross"
  | "stroke"
  | "number"
  | "velvet"
  | "cocoa";

export type CoverTheme = {
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  muted: string;
  pattern: CoverPattern;
};

export const COVER_THEMES: CoverTheme[] = [
  {
    bg: "#1C1814",
    bg2: "#3A2E24",
    ink: "#F3EDE4",
    accent: "#C56A3A",
    muted: "#B9A898",
    pattern: "arcs",
  },
  {
    bg: "#E8DCCB",
    bg2: "#CDB89A",
    ink: "#1A1612",
    accent: "#A85A32",
    muted: "#6E5E4E",
    pattern: "bars",
  },
  {
    bg: "#141C18",
    bg2: "#2A3C32",
    ink: "#E8EEE6",
    accent: "#B89A5A",
    muted: "#9AADA2",
    pattern: "rings",
  },
  {
    bg: "#261A22",
    bg2: "#3E2A38",
    ink: "#F2E8EC",
    accent: "#C48A9A",
    muted: "#B8A0AA",
    pattern: "split",
  },
  {
    bg: "#EFE6D8",
    bg2: "#D4C2A8",
    ink: "#1E1812",
    accent: "#8A4E32",
    muted: "#746656",
    pattern: "type",
  },
  {
    bg: "#1A1916",
    bg2: "#2E2C26",
    ink: "#F0EBE4",
    accent: "#A89878",
    muted: "#9A9488",
    pattern: "grid",
  },
  {
    bg: "#352418",
    bg2: "#5C3A26",
    ink: "#F4EBE2",
    accent: "#D4A070",
    muted: "#C4B09A",
    pattern: "bands",
  },
  {
    bg: "#141210",
    bg2: "#262018",
    ink: "#EEE8DC",
    accent: "#C8A878",
    muted: "#9A9084",
    pattern: "orbits",
  },
  {
    bg: "#E8E2D6",
    bg2: "#C8D0C4",
    ink: "#1A1814",
    accent: "#4A6A58",
    muted: "#6A7068",
    pattern: "wave",
  },
  {
    bg: "#221618",
    bg2: "#3E2428",
    ink: "#F4E8E8",
    accent: "#B85050",
    muted: "#C8A8A8",
    pattern: "stack",
  },
  {
    bg: "#F2EDE6",
    bg2: "#D8D0C4",
    ink: "#161412",
    accent: "#4A5560",
    muted: "#6E6860",
    pattern: "field",
  },
  {
    bg: "#181E1A",
    bg2: "#2E3A32",
    ink: "#E8F0EA",
    accent: "#C48A48",
    muted: "#A8B8AC",
    pattern: "slash",
  },
  {
    bg: "#2A221C",
    bg2: "#4E382C",
    ink: "#F2EAE0",
    accent: "#D4A46A",
    muted: "#C4B09A",
    pattern: "pulse",
  },
  {
    bg: "#EDE6D8",
    bg2: "#D2C2AA",
    ink: "#1A1612",
    accent: "#8A4240",
    muted: "#74685C",
    pattern: "frame",
  },
  {
    bg: "#161412",
    bg2: "#26221C",
    ink: "#F2EEE6",
    accent: "#C4A46A",
    muted: "#A8A090",
    pattern: "dots",
  },
  {
    bg: "#EFE2C8",
    bg2: "#D8B06A",
    ink: "#1C140C",
    accent: "#C05620",
    muted: "#7A5A32",
    pattern: "rise",
  },
  {
    bg: "#182028",
    bg2: "#2A3C36",
    ink: "#E8EEE8",
    accent: "#7AAA78",
    muted: "#A0B0A8",
    pattern: "crescent",
  },
  {
    bg: "#261A24",
    bg2: "#3C2A3E",
    ink: "#F2EAEF",
    accent: "#C898B0",
    muted: "#B8A8B4",
    pattern: "cross",
  },
  {
    bg: "#E6E4DC",
    bg2: "#C8C6BC",
    ink: "#1A1816",
    accent: "#6A5A4A",
    muted: "#7A7268",
    pattern: "stroke",
  },
  {
    bg: "#161210",
    bg2: "#2A221C",
    ink: "#F2EBE2",
    accent: "#C4A070",
    muted: "#B0A090",
    pattern: "number",
  },
  {
    bg: "#1A0B10",
    bg2: "#5C1224",
    ink: "#F7E6EA",
    accent: "#C73E52",
    muted: "#E0A8B0",
    pattern: "velvet",
  },
  {
    bg: "#1A100C",
    bg2: "#5A3826",
    ink: "#F2E6D6",
    accent: "#C49A78",
    muted: "#B89878",
    pattern: "cocoa",
  },
];

export const PALETTE_COUNT = COVER_THEMES.length;
const PATTERN_NAMES = COVER_THEMES.map((theme) => theme.pattern);
const COVER_SPACE = PALETTE_COUNT * PATTERN_NAMES.length;

type CoverBeat = Pick<BeatData, "id" | "coverVariant"> | { id: string; coverVariant?: number };

function numericId(id: string) {
  const numeric = parseInt(String(id), 10);
  if (Number.isFinite(numeric)) return numeric;
  return Array.from(String(id)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function themeFromCombo(paletteIndex: number, patternIndex: number): CoverTheme {
  const palette = COVER_THEMES[((paletteIndex % PALETTE_COUNT) + PALETTE_COUNT) % PALETTE_COUNT];
  const pattern = PATTERN_NAMES[((patternIndex % PATTERN_NAMES.length) + PATTERN_NAMES.length) % PATTERN_NAMES.length];
  return { ...palette, pattern };
}

function comboFromSlot(slot: number) {
  const combo = ((Math.abs(slot) * 23) % COVER_SPACE + COVER_SPACE) % COVER_SPACE;
  return {
    paletteIndex: combo % PALETTE_COUNT,
    patternIndex: Math.floor(combo / PALETTE_COUNT) % PATTERN_NAMES.length,
  };
}

function comboKey(paletteIndex: number, patternIndex: number) {
  return `${paletteIndex}:${patternIndex}`;
}

function assignCatalog(list: CoverBeat[]) {
  const used = new Set<string>();
  const byId = new Map<string, CoverTheme>();

  const claim = (paletteIndex: number, patternIndex: number) => {
    const key = comboKey(paletteIndex, patternIndex);
    if (used.has(key)) return false;
    used.add(key);
    return true;
  };

  const sorted = [...list].sort((a, b) => {
    const diff = numericId(a.id) - numericId(b.id);
    return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
  });

  for (const beat of sorted) {
    const natural = comboFromSlot(numericId(beat.id) - 1);
    let paletteIndex = natural.paletteIndex;
    let patternIndex = natural.patternIndex;

    const forced = Number(beat.coverVariant);
    if (Number.isFinite(forced) && forced > 0) {
      paletteIndex = (Math.floor(forced) - 1) % PALETTE_COUNT;
    }

    if (!claim(paletteIndex, patternIndex)) {
      let found = false;
      for (let step = 1; step < PATTERN_NAMES.length; step += 1) {
        const nextPattern = (patternIndex + step) % PATTERN_NAMES.length;
        if (claim(paletteIndex, nextPattern)) {
          patternIndex = nextPattern;
          found = true;
          break;
        }
      }
      if (!found) {
        for (let slot = 0; slot < COVER_SPACE; slot += 1) {
          const pal = slot % PALETTE_COUNT;
          const pat = Math.floor(slot / PALETTE_COUNT);
          if (claim(pal, pat)) {
            paletteIndex = pal;
            patternIndex = pat;
            found = true;
            break;
          }
        }
      }
    }

    byId.set(String(beat.id), themeFromCombo(paletteIndex, patternIndex));
  }

  return byId;
}

const catalogCovers = assignCatalog(beats);

export function getCoverIndex(beat: CoverBeat) {
  const theme = getCoverTheme(beat);
  const index = COVER_THEMES.findIndex(
    (candidate) => candidate.bg === theme.bg && candidate.accent === theme.accent
  );
  return index === -1 ? 0 : index;
}

export function getCoverTheme(beat: CoverBeat) {
  const assigned = catalogCovers.get(String(beat.id));
  if (assigned) return assigned;
  const { paletteIndex, patternIndex } = comboFromSlot(numericId(beat.id) - 1);
  return themeFromCombo(paletteIndex, patternIndex);
}

export function getAccentColor(beat: CoverBeat) {
  return getCoverTheme(beat).accent;
}
