import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "fs/promises";

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BUCKET = "beats";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment.");
  console.error("Ensure your .env has SUPABASE_URL and SUPABASE_KEY set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to safely build a path segment
const joinPath = (a = "", b = "") =>
  a ? `${a.replace(/\/+$/, "")}/${b.replace(/^(\/)+/, "")}` : b;

// Recursively list all files in a folder of a bucket
export async function getAllFiles(folder = "") {
  const all = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder || undefined, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error(`Error listing path "${folder}":`, error.message);
      break;
    }

    const items = data || [];
    if (items.length === 0) break;

    for (const item of items) {
      const isLikelyFolder = !item?.metadata || !item?.metadata?.mimetype;
      if (isLikelyFolder) {
        const nextFolder = joinPath(folder, item.name);
        const nested = await getAllFiles(nextFolder);
        all.push(...nested);
      } else {
        const path = joinPath(folder, item.name);
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);
        const publicUrl = urlData?.publicUrl;
        if (!publicUrl) {
          console.error(`Failed to get public URL for ${path}`);
        } else {
          all.push({ name: item.name, path, publicUrl });
        }
      }
    }

    if (items.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

async function main() {
  try {
    // Get all files from the entire bucket (recursively)
    const results = await getAllFiles("");

    // Log to console in the requested format
    for (const file of results) {
      console.log(`${file.name} → ${file.publicUrl}`);
    }

    // Bonus: save to JSON
    const jsonMap = Object.fromEntries(
      results.map((f) => [f.name, f.publicUrl])
    );
    await writeFile(
      "beatFileUrls.json",
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          bucket: BUCKET,
          files: jsonMap,
        },
        null,
        2
      )
    );
    console.log(`\nSaved ${results.length} file URLs to beatFileUrls.json`);

    // Example: also demonstrate fetching inside a specific folder like 'stems'
    // const stems = await getAllFiles('stems')
    // console.log(`\nStems (${stems.length}):`)
    // stems.forEach(f => console.log(`${f.name} → ${f.publicUrl}`))
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
