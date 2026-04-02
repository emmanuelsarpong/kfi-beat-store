/**
 * Canonical list of store beat ids and titles. Keep in sync with src/data/beats.ts.
 * Used for syncing beats table and for safe availability defaults.
 */
export const STORE_BEATS = [
  { id: "40", title: "Velvet" },
  { id: "39", title: "Sunrise" },
  { id: "38", title: "Give Me Love" },
  { id: "37", title: "DND" },
  { id: "36", title: "Crown" },
  { id: "35", title: "Cloudy Days" },
  { id: "34", title: "Gravity" },
  { id: "33", title: "Motion" },
  { id: "32", title: "Can't Stop" },
  { id: "31", title: "Ashes" },
  { id: "30", title: "Bliss" },
  { id: "29", title: "Sunset" },
  { id: "28", title: "Wait" },
  { id: "27", title: "Roses" },
  { id: "26", title: "Orbit" },
  { id: "25", title: "Pulse" },
  { id: "24", title: "I Like It" },
  { id: "23", title: "Run" },
  { id: "22", title: "Falling" },
  { id: "21", title: "Memories" },
  { id: "1", title: "Lucid" },
  { id: "2", title: "Prism" },
  { id: "3", title: "See You Go" },
  { id: "4", title: "Eyes On Me" },
];

const STORE_BEAT_IDS = new Set(STORE_BEATS.map((b) => String(b.id)));

export function isStoreBeatId(id) {
  return id != null && STORE_BEAT_IDS.has(String(id));
}

export function getStoreBeatTitle(id) {
  const b = STORE_BEATS.find((x) => String(x.id) === String(id));
  return b ? b.title : null;
}

/**
 * Ensure a single beat row exists. Insert only if missing; never overwrite sold/exclusive_available/sold_at/first_lease_at.
 * @param {object} supabase - Supabase client
 * @returns {{ inserted: boolean, error?: object }}
 */
export async function ensureBeatRow(supabase, beatId, title) {
  if (!supabase || !beatId) return { inserted: false };
  const id = String(beatId);
  const safeTitle = typeof title === "string" ? title.trim() : getStoreBeatTitle(id) || id;
  try {
    const { error } = await supabase.from("beats").upsert(
      {
        id,
        title: safeTitle,
        sold: false,
        exclusive_available: true,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    // ignoreDuplicates: insert only; existing rows are not updated (sold/exclusive_available preserved)
    if (error) return { inserted: false, error };
    return { inserted: true };
  } catch (e) {
    return { inserted: false, error: e };
  }
}

/**
 * Ensure every store beat has a row. Idempotent; does not overwrite existing sold/exclusive_available.
 * @param {object} supabase - Supabase client
 */
export async function ensureAllStoreBeats(supabase) {
  if (!supabase) return;
  for (const { id, title } of STORE_BEATS) {
    await ensureBeatRow(supabase, id, title);
  }
}
