import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Retry failed Stripe webhook events stored in public.stripe_events.
 *
 * Usage:
 *   node server/scripts/retryStripeEvents.js --limit=25
 *
 * Notes:
 * - This script only flips status from failed->received, letting your normal webhook processor re-run it.
 * - It is safe because processing is designed to be idempotent (unique purchase upsert + fulfilled flag).
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseLimit() {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  const n = arg ? Number(arg.split("=", 2)[1]) : 25;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 25;
}

const limit = parseLimit();

async function main() {
  const { data: rows, error } = await supabase
    .from("stripe_events")
    .select("id, event_id, event_type, status, updated_at")
    .eq("status", "failed")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to query stripe_events:", error.message || error);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No failed stripe_events to retry.");
    return;
  }

  console.log(`Retrying ${rows.length} failed stripe_events...`);

  for (const r of rows) {
    const eventId = r.event_id;
    const eventType = r.event_type;
    const { error: upErr } = await supabase
      .from("stripe_events")
      .update({
        status: "received",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "failed");

    if (upErr) {
      console.error("[retry] failed to mark received", {
        eventId,
        eventType,
        error: upErr.message || upErr,
      });
    } else {
      console.log("[retry] queued", { eventId, eventType });
    }
  }

  console.log(
    "Done. These events will be processed next time the webhook worker runs.\n" +
      "Tip: you can also replay from Stripe Dashboard; duplicates are deduped by event_id."
  );
}

main().catch((e) => {
  console.error("Retry script failed:", e?.stack || e);
  process.exit(1);
});

