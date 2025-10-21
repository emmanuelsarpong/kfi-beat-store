import "dotenv/config";
import express from "express";
import cors from "cors";
// SMTP transport disabled: using Resend only for email delivery
import Stripe from "stripe";
import { Resend } from "resend";
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
// Simple in-memory guard to avoid duplicate download emails per process
const SENT_SESSIONS = new Set();

// Allow local dev from any origin to avoid CORS issues when Vite runs on different ports
app.use(cors({ origin: true, credentials: false }));

// Helper: list files recursively under a folder and create signed URLs
async function listSignedFiles(prefix = "", expiresSec = 60 * 60) {
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
          .createSignedUrl(path, expiresSec);
        if (signErr) throw signErr;
        all.push({ name: item.name, path, url: signed?.signedUrl });
      }
    }
    if (items.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

// --- Email config (Resend only) ---
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "KFI Music <no-reply@example.com>";
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || SMTP_USER;
// Explicitly disable SMTP; all emails will be sent via Resend
const mailer = null;

// --- Resend fallback ---
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const RESEND_FROM =
  process.env.RESEND_FROM || SMTP_FROM || "KFI Music <onboarding@resend.dev>";

// Reverse map from Stripe IDs (price_ or prod_) to our beat key
const STRIPE_ID_TO_BEAT = (() => {
  const map = new Map();
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith("STRIPE_PRICE_ID_")) continue;
    if (!v) continue;
    const beatKey = k.replace("STRIPE_PRICE_ID_", "").toLowerCase();
    map.set(v, beatKey);
  }
  return map;
})();

function slugifyTitleToFolder(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

async function sendDownloadEmail({
  to,
  productName,
  files,
  expiresHours = 24,
}) {
  const list = files || [];
  const raw = Array.isArray(files) ? files : [];
  const cleaned = raw
    .filter((f) => f && f.url && f.name && !String(f.name).startsWith("."))
    .map((f) => ({ name: String(f.name), url: String(f.url) }));

  // Sort: stems.zip first, then WAV, MP3, ZIP, then others
  const rank = (name) => {
    const n = String(name).toLowerCase();
    if (n === "stems.zip") return 0;
    if (n.endsWith(".wav")) return 1;
    if (n.endsWith(".mp3")) return 2;
    if (n.endsWith(".zip")) return 3;
    return 4;
  };
  const sorted = cleaned.sort((a, b) => rank(a.name) - rank(b.name));

  const itemsHtml = sorted
    .map(
      (f) => `
        <tr>
          <td style="padding:8px 0">
            <a href="${f.url}"
               style="display:inline-block;background:#FBBF24;color:#111;font-weight:600;text-decoration:none;padding:12px 16px;border-radius:8px;min-width:220px;text-align:center;font-family:Inter,Segoe UI,Arial,sans-serif">
              Download ${f.name}
            </a>
          </td>
        </tr>`
    )
    .join("");

  const safeName = String(productName || "Your Beat").replace(/[<>]/g, "");
  const hours = Number(expiresHours || 24);
  const preheader = `Your ${safeName} download is ready.`;

  const html = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Your download</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;color:#e5e7eb;">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden">${preheader}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0b0b0b">
      <tr>
        <td />
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;margin:0 auto;">
            <tr>
              <td style="padding:28px 24px 8px; text-align:center;">
                <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:13px;letter-spacing:.08em;color:#fbbf24;font-weight:700;">K F I &nbsp; M U S I C</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0;">
                <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:22px;font-weight:800;color:#fff;">Your download: ${safeName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 0;">
                <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:14px;line-height:22px;color:#d4d4d8;">
                  Thanks for your purchase! Your files are ready below. Links expire in about ${hours} hour${
    hours === 1 ? "" : "s"
  }.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  ${itemsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 24px 30px;">
                <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;line-height:18px;color:#a1a1aa;">
                  If these links expire, just reply to this email and we'll help you out.
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td />
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Thanks for your purchase!`,
    `Your beat ${safeName} is ready. Links expire in about ${hours} hour${
      hours === 1 ? "" : "s"
    }.`,
    "",
    ...sorted.map((f) => `- ${f.name}: ${f.url}`),
    "",
    "If the links expire, reply to this email and we'll help you out.",
  ].join("\n");

  if (!resend) {
    console.warn("[email] Resend not configured; email not sent");
    return;
  }
  await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject: `Your download: ${productName}`,
    html,
  });
}

async function markBeatAsSold({ beatId, productName }) {
  if (!supabase) return; // optional best-effort
  try {
    if (beatId) {
      await supabase
        .from("beats")
        .update({ sold: true, sold_at: new Date().toISOString() })
        .eq("id", beatId);
      return;
    }
    if (productName) {
      await supabase
        .from("beats")
        .update({ sold: true, sold_at: new Date().toISOString() })
        .ilike("title", productName);
    }
  } catch (e) {
    console.warn(
      "[sold] update failed (table may not exist):",
      e?.message || e
    );
  }
}

// --- Stripe Webhook (must be before express.json for raw body) ---
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.sendStatus(200);
    let event;
    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(
        "[webhook] signature verification failed",
        err?.message || err
      );
      return res.sendStatus(400);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const email =
          session?.customer_details?.email || session?.customer_email;
        const beatIdMeta =
          session?.metadata?.beat || session?.client_reference_id;

        const full = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price.product"],
        });
        const item = full?.line_items?.data?.[0];
        const price = item?.price;
        const product = price?.product;
        const priceId = price?.id;
        const productId = typeof product === "object" ? product?.id : undefined;
        const productName =
          typeof product === "object" ? product?.name : undefined;

        let beatKey =
          beatIdMeta ||
          STRIPE_ID_TO_BEAT.get(priceId) ||
          STRIPE_ID_TO_BEAT.get(productId) ||
          null;
        const folder = productName
          ? slugifyTitleToFolder(productName)
          : beatKey;

        let files = [];
        try {
          if (folder) files = await listSignedFiles(folder, 60 * 60 * 24);
        } catch (e) {
          console.error(
            "[webhook] failed to sign files for",
            folder,
            e?.message || e
          );
        }

        if (email && files.length > 0) {
          await sendDownloadEmail({
            to: email,
            productName: productName || "Your Beat",
            files,
            expiresHours: 24,
          });
          try {
            SENT_SESSIONS.add(session.id);
          } catch {}
        }

        await markBeatAsSold({ beatId: beatKey, productName });
      }
    } catch (e) {
      console.error("[webhook] handler error", e);
      return res.sendStatus(200);
    }
    return res.sendStatus(200);
  }
);

// JSON parser for the rest of the routes
app.use(express.json());

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    if (!resend)
      return res
        .status(500)
        .json({ ok: false, error: "Resend not configured" });
    const { name, email, message } = req.body || {};
    if (!name || !email || !message)
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });

    const to = CONTACT_RECIPIENT;
    const subject = `New contact message from ${name}`;
    const html = `
      <p><strong>Name:</strong> ${String(name).replace(/[<>]/g, "")}</p>
      <p><strong>Email:</strong> ${String(email).replace(/[<>]/g, "")}</p>
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
    `;
    const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    try {
      const r = await resend.emails.send({
        from: RESEND_FROM,
        to,
        subject,
        html,
        text,
        reply_to: email,
      });
      return res.json({
        ok: true,
        transport: "resend",
        id: r?.data?.id || null,
      });
    } catch (e) {
      console.error("[contact] Resend send failed:", e);
      return res.status(500).json({ ok: false, error: "Failed to send" });
    }
  } catch (e) {
    console.error("[contact] failed to send", e);
    return res.status(500).json({ ok: false, error: "Failed to send" });
  }
});

// Route: Create checkout session
app.post("/api/checkout/create", async (req, res) => {
  try {
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    const {
      beatId = "lucid",
      returnUrl = FRONTEND_URL,
      promotionCode,
    } = req.body || {};
    console.log("[checkout] create", { beatId, returnUrl });
    // Resolve a Stripe Price ID from beatId (supports Price IDs and Product IDs)
    const resolvePriceId = async (id) => {
      if (!id) return undefined;
      const map = {
        lucid: STRIPE_PRICE_ID_LUCID,
        1: STRIPE_PRICE_ID_LUCID,
        sunset: process.env.STRIPE_PRICE_ID_SUNSET,
        29: process.env.STRIPE_PRICE_ID_29,
      };
      let val = map[id];
      if (!val) {
        // Allow per-beat env like STRIPE_PRICE_ID_29 or STRIPE_PRICE_ID_SUNSET
        const envKey = `STRIPE_PRICE_ID_${String(id).toUpperCase()}`;
        val = process.env[envKey];
      }
      if (!val) return undefined;
      // If a Price ID is provided, use it as-is
      if (typeof val === "string" && val.startsWith("price_")) return val;
      // If a Product ID is provided, derive its default price
      if (typeof val === "string" && val.startsWith("prod_")) {
        try {
          const product = await stripe.products.retrieve(val);
          const dp = product?.default_price;
          if (typeof dp === "string") return dp;
          if (dp && typeof dp === "object" && dp.id) return dp.id;
          // Fallback: pick any active price for the product
          const prices = await stripe.prices.list({
            product: val,
            active: true,
            limit: 1,
          });
          if (prices?.data?.[0]?.id) return prices.data[0].id;
        } catch (e) {
          console.error("[checkout] failed to resolve price from product", e);
          return undefined;
        }
      }
      // Unknown format; return as-is and let Stripe error if invalid
      return val;
    };
    const priceId = await resolvePriceId(beatId);
    if (!priceId)
      return res.status(400).json({
        error:
          "No Stripe Price configured for this beat. Set STRIPE_PRICE_ID_<BEAT_ID> (e.g., STRIPE_PRICE_ID_29) or STRIPE_PRICE_ID_<SLUG> (e.g., STRIPE_PRICE_ID_SUNSET) in .env. You may set either a price_... or a prod_... (product) ID with a default price.",
      });

    const sessionCreate = {
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}/download?session_id={CHECKOUT_SESSION_ID}&beat=${encodeURIComponent(
        String(beatId)
      )}`,
      cancel_url: `${returnUrl}/`,
      client_reference_id: String(beatId),
      metadata: { beat: String(beatId) },
      allow_promotion_codes: true,
    };
    if (promotionCode && typeof promotionCode === "string") {
      // Apply a specific promotion code automatically if provided
      // Note: promotionCode here should be the promotion_code ID (promo_...), not the human-readable code
      sessionCreate.discounts = [{ promotion_code: promotionCode }];
    }
    const session = await stripe.checkout.sessions.create(sessionCreate);
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

    // Verify payment status with Stripe and expand product to infer canonical folder
    console.log("[downloads] verify", { beat, sessionId });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
    const paid =
      session?.payment_status === "paid" || session?.status === "complete";
    if (!paid) return res.status(403).json({ error: "Payment not verified" });

    const item = session?.line_items?.data?.[0];
    const price = item?.price;
    const product = price?.product;
    const productName = typeof product === "object" ? product?.name : undefined;
    const customerEmail =
      session?.customer_details?.email || session?.customer_email || null;
    const inferredFolder = productName
      ? slugifyTitleToFolder(productName)
      : null;

    // Prefer folder inferred from Stripe Product name; fallback to URL param
    let files = [];
    let usedFolder = inferredFolder || beat;
    try {
      if (usedFolder) files = await listSignedFiles(usedFolder, 60 * 60);
      // If nothing found, fallback once to the other option
      if (
        files.length === 0 &&
        inferredFolder &&
        beat &&
        beat !== inferredFolder
      ) {
        usedFolder = beat;
        files = await listSignedFiles(beat, 60 * 60);
      }
    } catch (e) {
      // Try fallback if first attempt failed
      if (inferredFolder && beat && beat !== inferredFolder) {
        try {
          usedFolder = beat;
          files = await listSignedFiles(beat, 60 * 60);
        } catch (e2) {
          console.error("[downloads] both folder attempts failed", e2);
          return res.status(500).json({ error: "Failed to locate beat files" });
        }
      } else {
        console.error("[downloads] error", e);
        return res
          .status(500)
          .json({ error: "Failed to generate download URLs" });
      }
    }

    // If still empty, return 404 to let UI show an actionable message
    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ error: `No files found for ${usedFolder || beat}` });
    }
    // Opportunistic fallback: if webhook didn't send the email, send it now once per session
    try {
      if (customerEmail && files.length > 0 && !SENT_SESSIONS.has(sessionId)) {
        await sendDownloadEmail({
          to: customerEmail,
          productName: productName || usedFolder || "Your Beat",
          files,
          expiresHours: 24,
        });
        SENT_SESSIONS.add(sessionId);
      }
    } catch (e) {
      console.warn("[downloads] fallback email send failed:", e?.message || e);
    }

    return res.json({
      beat: usedFolder,
      sessionId,
      count: files.length,
      files,
    });
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

// SMTP connectivity check (optional)
app.get("/api/smtp/verify", async (_req, res) => {
  // SMTP intentionally disabled; using Resend only
  return res
    .status(200)
    .json({ ok: false, error: "SMTP disabled; using Resend only" });
});

// Email transport status (debug)
app.get("/api/email/transport", (_req, res) => {
  res.json({
    smtpConfigured: false,
    resendConfigured: Boolean(resend),
    from: SMTP_FROM || null,
    resendFrom: RESEND_FROM || null,
    to: CONTACT_RECIPIENT || null,
  });
});

// Send a test contact email (debug)
app.post("/api/email/test-contact", async (_req, res) => {
  try {
    if (!resend)
      return res
        .status(500)
        .json({ ok: false, error: "Resend not configured" });
    const to = CONTACT_RECIPIENT;
    const subject = "Test contact delivery";
    const html = `<p>This is a test contact email sent at ${new Date().toISOString()}.</p>`;
    const text = `Test contact email ${new Date().toISOString()}`;
    const r = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject,
      html,
      text,
    });
    return res.json({ ok: true, transport: "resend", id: r?.data?.id || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Send a test download email for a folder (debug)
app.post("/api/email/test-download", async (req, res) => {
  try {
    if (!resend)
      return res
        .status(500)
        .json({ ok: false, error: "Resend not configured" });
    const { to, folder } = req.body || {};
    if (!to || !folder)
      return res.status(400).json({ ok: false, error: "Missing to or folder" });
    const files = await listSignedFiles(String(folder), 60 * 60); // 1 hour links
    await sendDownloadEmail({
      to,
      productName: folder,
      files,
      expiresHours: 1,
    });
    return res.json({ ok: true, count: files?.length || 0 });
  } catch (e) {
    console.error("[test-download] error", e);
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Webhook implemented above

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
