import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 8787;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID_LUCID = process.env.STRIPE_PRICE_ID_LUCID;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

// Supabase (service role for signing URLs)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Warning: SUPABASE_URL or SUPABASE_KEY missing; downloads API will fail until set."
  );
}
const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;
const BUCKET = "beats";

// Allow local dev from any origin to avoid CORS issues when Vite runs on different ports
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

// Helper: list files recursively under a folder and create signed URLs
async function listSignedFiles(prefix = "") {
  if (!supabase) throw new Error("Supabase not configured");
  const all = [];
  const pageSize = 100;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix || undefined, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
    if (error) throw error;
    const items = data || [];
    if (items.length === 0) break;
    for (const item of items) {
      const isFolder = !item?.metadata || !item?.metadata?.mimetype;
      if (isFolder) {
        const nested = await listSignedFiles(
          `${prefix ? prefix + "/" : ""}${item.name}`
        );
        all.push(...nested);
      } else {
        const path = `${prefix ? prefix + "/" : ""}${item.name}`;
        const { data: signed, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60);
        if (signErr) throw signErr;
        all.push({ name: item.name, path, url: signed?.signedUrl });
      }
    }
    if (items.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

// Route: Create checkout session
app.post("/api/checkout/create", async (req, res) => {
  try {
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    const { beatId = "lucid", returnUrl = FRONTEND_URL } = req.body || {};
    console.log("[checkout] create", { beatId, returnUrl });
    // Map beat id/slug to Stripe Price ID
    let priceId;
    if (beatId === "lucid" || beatId === "1") priceId = STRIPE_PRICE_ID_LUCID;
    if (!priceId) return res.status(400).json({ error: "Unknown beat" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}/download?session_id={CHECKOUT_SESSION_ID}&beat=lucid`,
      cancel_url: `${returnUrl}/`,
      metadata: { beat: "lucid" },
    });
    console.log("[checkout] session created", session.id);
    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("[checkout] error", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Route: Provide signed download URLs after successful payment
app.get("/api/downloads/:beat/:sessionId", async (req, res) => {
  try {
    const { beat, sessionId } = req.params;
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    if (!supabase)
      return res.status(500).json({ error: "Supabase not configured" });
    if (beat !== "lucid")
      return res.status(404).json({ error: "Unknown beat" });

    // Verify payment status with Stripe
    console.log("[downloads] verify", { beat, sessionId });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session?.payment_status === "paid" || session?.status === "complete";
    if (!paid) return res.status(403).json({ error: "Payment not verified" });

    // Build file list: stems plus master files in lucid folder
    const stems = await listSignedFiles("lucid/stems");
    const rootFiles = [];
    for (const fname of ["lucid/Lucid.mp3", "lucid/Lucid - Master.wav"]) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(fname, 60 * 60);
      if (!error && data?.signedUrl)
        rootFiles.push({ name: fname, path: fname, url: data.signedUrl });
    }
    const files = [...rootFiles, ...stems];
    return res.json({ beat, sessionId, count: files.length, files });
  } catch (err) {
    console.error("[downloads] error", err);
    return res.status(500).json({ error: "Failed to generate download URLs" });
  }
});

// Route: Short-lived signed preview (e.g., for private bucket playback)
app.get("/api/preview/:beat", async (req, res) => {
  try {
    if (!supabase)
      return res.status(500).json({ error: "Supabase not configured" });
    const { beat } = req.params;
    if (beat !== "lucid")
      return res.status(404).json({ error: "Unknown beat" });
    // Sign Lucid.mp3 for a short time (5 minutes)
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl("lucid/Lucid.mp3", 60 * 5);
    if (error || !data?.signedUrl)
      return res.status(500).json({ error: "Failed to sign preview URL" });
    if (req.query.redirect === "1") {
      return res.redirect(data.signedUrl);
    }
    return res.json({ url: data.signedUrl });
  } catch (err) {
    console.error("[preview] error", err);
    return res.status(500).json({ error: "Preview failed" });
  }
});

// Simple health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, frontend: FRONTEND_URL });
});

// Optional: Stripe webhook placeholder (not required for basic flow)
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.sendStatus(200);
    try {
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
      // You can handle events if you want to persist purchases
      console.log("Webhook event:", event.type);
    } catch (err) {
      console.error("Webhook error", err);
      return res.sendStatus(400);
    }
    return res.sendStatus(200);
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
