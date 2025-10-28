import "dotenv/config";
import express from "express";
import { requestLogger } from "./utils/logger.js";
import {
  corsPolicy,
  gzipCompression,
  securityHeaders,
} from "./middleware/security.js";
import { notFound, errorHandler } from "./middleware/error.js";
import {
  contactLimiter,
  checkoutLimiter,
  webhookLimiter,
  generalLimiter,
} from "./utils/rateLimit.js";

// Keep existing implementation by importing from index.js (original) pieces
// We will import and reuse most of the logic from the original index.js file
// by moving it here. For minimal change, we will include the core logic inline.

import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const INSTAGRAM_URL =
  process.env.INSTAGRAM_URL || "https://instagram.com/kfimusic";
const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/logo/KFI%20Logo.PNG";

// Apply security and performance middleware early
app.use(securityHeaders());
app.use(gzipCompression());
app.use(requestLogger());
app.use(corsPolicy());

// Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID_LUCID = process.env.STRIPE_PRICE_ID_LUCID;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

// Supabase
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
const SENT_SESSIONS = new Set();

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

// Only allow certain file types in customer-facing downloads
function isAllowedDownload(name) {
  const n = String(name || "").toLowerCase();
  return n.endsWith(".wav") || n.endsWith(".zip");
}

// Email (Resend only)
const CONTACT_RECIPIENT =
  process.env.CONTACT_RECIPIENT || "info.kfimusic@gmail.com";
const CONTACT_RECIPIENTS =
  process.env.CONTACT_RECIPIENTS || CONTACT_RECIPIENT || "";
const CONTACT_BCC = process.env.CONTACT_BCC || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const DEFAULT_ONBOARDING_FROM = "KFI Music <onboarding@resend.dev>";
const RAW_RESEND_FROM = process.env.RESEND_FROM || "";
const RESEND_FALLBACK_FROM =
  process.env.RESEND_FALLBACK_FROM || DEFAULT_ONBOARDING_FROM;
// Runtime-adjustable sender mode: auto | onboarding | branded
let SENDER_MODE = (process.env.FORCE_SENDER_MODE || "auto").toLowerCase();
function getResendFrom() {
  const raw = RAW_RESEND_FROM || DEFAULT_ONBOARDING_FROM;
  if (SENDER_MODE === "onboarding") return DEFAULT_ONBOARDING_FROM;
  if (SENDER_MODE === "branded") return raw;
  // auto: avoid unverified branded domain during verification
  if (/@send\.kfimusic\.com\b/i.test(raw)) return DEFAULT_ONBOARDING_FROM;
  return raw;
}

// SMTP Fallback (e.g., Gmail App Password)
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 0);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "";
const smtpEnabled = Boolean(
  SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM
);
let smtpTransport = null;
if (smtpEnabled) {
  try {
    smtpTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for others
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } catch (e) {
    console.warn("[smtp] failed to create transport:", e?.message || e);
  }
}

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
  const raw = Array.isArray(files) ? files : [];
  const cleaned = raw
    .filter((f) => f && f.url && f.name && !String(f.name).startsWith("."))
    .map((f) => ({ name: String(f.name), url: String(f.url) }))
    .filter((f) => isAllowedDownload(f.name));
  const rank = (name) => {
    const n = String(name).toLowerCase();
    if (n === "stems.zip") return 0;
    if (n.endsWith(".wav")) return 1;
    if (n.endsWith(".zip")) return 2;
    return 3;
  };
  const sorted = cleaned.sort((a, b) => rank(a.name) - rank(b.name));
  const safeName = String(productName || "Your Beat").replace(/[<>]/g, "");
  const hours = Number(expiresHours || 24);
  // Text-only fallback
  const text = [
    `Your download: ${safeName}`,
    `Links expire in about ${hours} hour${hours === 1 ? "" : "s"}.`,
    "",
    ...sorted.map((f) => `• ${f.name}: ${f.url}`),
    "",
    "If these links expire, just reply to this email and we'll help you out.",
  ].join("\n");

  // Simple, responsive, brand-styled HTML (works in most email clients)
  const itemsHtml = sorted
    .map(
      (f) => `
        <tr>
          <td style="padding:10px 0" align="center">
            <a href="${f.url}"
               style="display:inline-block;background:#FBBF24;color:#111;font-weight:700;text-decoration:none;padding:14px 18px;border-radius:10px;min-width:240px;text-align:center;font-family:Inter,Segoe UI,Arial,sans-serif">
              Download ${f.name}
            </a>
          </td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;color:#e5e7eb;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your download: ${safeName} — links expire in about ${hours} hour${
    hours === 1 ? "" : "s"
  }.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0b0b0b;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;background:#111111;border-radius:16px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.35);">
            <tr>
              <td align="center" style="padding:28px 24px 8px 24px;background:#0b0b0b;">
                <img src="${EMAIL_LOGO_URL}" width="72" height="72" alt="KFI Music" style="display:block;border:0;outline:none;text-decoration:none;border-radius:12px;width:72px;height:72px;" />
                <div style="font-family:Inter,Segoe UI,Arial,sans-serif;letter-spacing:6px;color:#FBBF24;font-weight:800;font-size:12px;margin-top:8px;">K F I&nbsp;&nbsp;M U S I C</div>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:8px 24px 0 24px;">
                <h1 style="margin:16px 0 8px 0;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:24px;line-height:1.25;color:#ffffff;">Your download: ${safeName}</h1>
                <p style="margin:0 0 12px 0;font-family:Inter,Segoe UI,Arial,sans-serif;color:#d1d5db;font-size:15px;">Thanks for your purchase! Your files are ready below. Links expire in about ${hours} hour${
    hours === 1 ? "" : "s"
  }.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 24px 20px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:460px;">
                  ${itemsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 24px 24px;">
                <a href="${FRONTEND_URL}/store" style="display:inline-block;background:transparent;color:#FBBF24;border:1px solid #FBBF24;font-weight:700;text-decoration:none;padding:12px 16px;border-radius:9999px;min-width:220px;text-align:center;font-family:Inter,Segoe UI,Arial,sans-serif">View in store</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 2px 24px;">
                <hr style="border:none;border-top:1px solid #1f2937;margin:0;" />
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:16px 24px 24px 24px;">
                <p style="margin:0 0 10px 0;font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:13px;">• If these links expire, reply to this email and we'll help you out.</p>
                <p style="margin:0 0 10px 0;font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:13px;">• Having trouble? Try another browser or copy the link address directly.</p>
                <p style="margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:13px;">Support: <a href="mailto:info.kfimusic@gmail.com" style="color:#FBBF24;text-decoration:none;">info.kfimusic@gmail.com</a></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:6px 24px 18px 24px;">
                <a href="${FRONTEND_URL}" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;text-decoration:none;margin-right:14px;">kfimusic.com</a>
                <a href="${INSTAGRAM_URL}" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;text-decoration:none;">Instagram</a>
              </td>
            </tr>
          </table>
          <div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#6b7280;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} KFI Music</div>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
  if (!resend) {
    console.warn("[email] Resend not configured; email not sent");
    return;
  }
  // Resend SDK returns { data, error } and doesn't always throw.
  const primary = await resend.emails.send({
    from: getResendFrom(),
    to,
    subject: `Your download: ${productName}`,
    html,
    text,
    headers: {
      "X-KFI-Template": "download-v2",
      "X-KFI-Sender-Mode": SENDER_MODE,
    },
  });
  if (primary?.error) {
    console.warn("[email] primary send error:", primary.error);
    if (RESEND_FALLBACK_FROM && RESEND_FALLBACK_FROM !== getResendFrom()) {
      console.warn(
        "[email] retrying with fallback from:",
        RESEND_FALLBACK_FROM
      );
      const fallback = await resend.emails.send({
        from: RESEND_FALLBACK_FROM,
        to,
        subject: `Your download: ${productName}`,
        html,
        text,
        headers: { "X-KFI-Template": "download-v2-fallback" },
      });
      if (fallback?.error) {
        console.warn("[email] fallback send error:", fallback.error);
        // Try SMTP as last resort
        if (smtpTransport) {
          try {
            const info = await smtpTransport.sendMail({
              from: SMTP_FROM,
              to,
              subject: `Your download: ${productName}`,
              html,
              text,
            });
            console.log("[email] smtp send ok:", info?.messageId || null);
            return;
          } catch (smtpErr) {
            console.error(
              "[email] smtp send failed:",
              smtpErr?.response || smtpErr?.message || smtpErr
            );
            throw new Error(
              `All transports failed: ${
                fallback.error?.message || smtpErr?.message || "unknown"
              }`
            );
          }
        }
        throw new Error(
          `Resend failed: ${fallback.error?.message || "unknown error"}`
        );
      } else {
        console.log("[email] fallback send ok:", fallback?.data?.id || null);
      }
    } else {
      // Try SMTP if configured
      if (smtpTransport) {
        try {
          const info = await smtpTransport.sendMail({
            from: SMTP_FROM,
            to,
            subject: `Your download: ${productName}`,
            html,
            text,
          });
          console.log("[email] smtp send ok:", info?.messageId || null);
          return;
        } catch (smtpErr) {
          console.error(
            "[email] smtp send failed:",
            smtpErr?.response || smtpErr?.message || smtpErr
          );
        }
      }
      throw new Error(
        `Resend failed: ${primary.error?.message || "unknown error"}`
      );
    }
  } else {
    console.log("[email] send ok:", primary?.data?.id || null);
  }
}

// --- Routes ---

// Stripe webhook must use raw body and sit before json parser
app.post(
  "/webhook/stripe",
  webhookLimiter,
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
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const session = event.data.object;
        let email = session?.customer_details?.email || session?.customer_email;
        const beatIdMeta =
          session?.metadata?.beat || session?.client_reference_id;
        const full = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price.product"],
        });
        if (!email) {
          email = full?.customer_details?.email || email;
        }
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
          // Fallback to beatKey if productName-based folder had no files
          if (files.length === 0 && beatKey && beatKey !== folder) {
            files = await listSignedFiles(beatKey, 60 * 60 * 24);
          }
        } catch (e) {
          console.error(
            "[webhook] failed to sign files for",
            folder,
            e?.message || e
          );
          // try best-effort fallback once
          if (beatKey && beatKey !== folder) {
            try {
              files = await listSignedFiles(beatKey, 60 * 60 * 24);
              // Filter out disallowed file types (e.g., exclude .mp3)
              files = files.filter((f) => isAllowedDownload(f?.name));
            } catch (e2) {
              console.error(
                "[webhook] fallback sign failed for",
                beatKey,
                e2?.message || e2
              );
            }
          }
        }
        if (!email) {
          console.warn(
            "[webhook] no customer email present for session",
            session?.id
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
        // best-effort mark sold
        try {
          if (supabase) {
            if (beatKey) {
              await supabase
                .from("beats")
                .update({ sold: true, sold_at: new Date().toISOString() })
                .eq("id", beatKey);
            } else if (productName) {
              await supabase
                .from("beats")
                .update({ sold: true, sold_at: new Date().toISOString() })
                .ilike("title", productName);
            }
          }
        } catch {}
      }
    } catch (e) {
      console.error("[webhook] handler error", e);
      return res.sendStatus(200);
    }
    return res.sendStatus(200);
  }
);

// Apply general rate limiting after webhook to avoid interfering with Stripe delivery
app.use(generalLimiter);

// JSON parser for normal routes (after webhook)
app.use(express.json());

// Contact
app.post("/api/contact", contactLimiter, async (req, res) => {
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
    const toList = (CONTACT_RECIPIENTS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const to = toList.length > 0 ? toList : CONTACT_RECIPIENT;
    const bccList = (CONTACT_BCC || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const subject = `[KFI Contact] ${name}`;
    const safeName = String(name).replace(/[<>]/g, "");
    const safeEmail = String(email).replace(/[<>]/g, "");
    const safeMsg = String(message)
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    const html = `<!doctype html><html><body><h1>New contact</h1><p><b>Name:</b> ${safeName}</p><p><b>Email:</b> ${safeEmail}</p><p>${safeMsg}</p></body></html>`;
    const text = `New contact\nName: ${safeName}\nEmail: ${safeEmail}\n\n${message}`;
    // Primary send
    let r = await resend.emails.send({
      from: getResendFrom(),
      to,
      bcc: bccList.length ? bccList : undefined,
      subject,
      html,
      text,
      headers: { "X-KFI-Contact": new Date().toISOString() },
      reply_to: email,
    });
    if (r?.error) {
      console.warn("[contact] primary send error:", r.error);
      if (RESEND_FALLBACK_FROM && RESEND_FALLBACK_FROM !== getResendFrom()) {
        console.warn(
          "[contact] retrying with fallback from",
          RESEND_FALLBACK_FROM
        );
        r = await resend.emails.send({
          from: RESEND_FALLBACK_FROM,
          to,
          bcc: bccList.length ? bccList : undefined,
          subject,
          html,
          text,
          headers: { "X-KFI-Contact": new Date().toISOString() },
          reply_to: email,
        });
        if (r?.error) {
          console.warn("[contact] fallback send error:", r.error);
          if (smtpTransport) {
            try {
              const info = await smtpTransport.sendMail({
                from: SMTP_FROM,
                to: Array.isArray(to) ? to.join(",") : to,
                subject,
                html,
                text,
              });
              console.log("[contact] smtp send ok:", info?.messageId || null);
              return res.json({
                ok: true,
                transport: "smtp",
                to,
                from: SMTP_FROM,
              });
            } catch (smtpErr) {
              console.error(
                "[contact] smtp send failed:",
                smtpErr?.message || smtpErr
              );
              return res.status(500).json({
                ok: false,
                error: r.error?.message || smtpErr?.message || "send failed",
              });
            }
          }
          return res
            .status(500)
            .json({ ok: false, error: r.error?.message || "send failed" });
        }
      } else {
        if (smtpTransport) {
          try {
            const info = await smtpTransport.sendMail({
              from: SMTP_FROM,
              to: Array.isArray(to) ? to.join(",") : to,
              subject,
              html,
              text,
            });
            console.log("[contact] smtp send ok:", info?.messageId || null);
            return res.json({
              ok: true,
              transport: "smtp",
              to,
              from: SMTP_FROM,
            });
          } catch (smtpErr) {
            console.error(
              "[contact] smtp send failed:",
              smtpErr?.message || smtpErr
            );
            return res.status(500).json({
              ok: false,
              error: r.error?.message || smtpErr?.message || "send failed",
            });
          }
        }
        return res
          .status(500)
          .json({ ok: false, error: r.error?.message || "send failed" });
      }
    }
    return res.json({
      ok: true,
      transport: "resend",
      id: r?.data?.id || null,
      to,
      bcc: bccList,
      from: getResendFrom(),
    });
  } catch (e) {
    console.error("[contact] send failed", e);
    return res.status(500).json({ ok: false, error: "Failed to send" });
  }
});

// Checkout
app.post("/api/checkout/create", checkoutLimiter, async (req, res) => {
  try {
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    const {
      beatId = "lucid",
      returnUrl = FRONTEND_URL,
      promotionCode,
    } = req.body || {};
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
        const envKey = `STRIPE_PRICE_ID_${String(id).toUpperCase()}`;
        val = process.env[envKey];
      }
      if (!val) return undefined;
      if (typeof val === "string" && val.startsWith("price_")) return val;
      if (typeof val === "string" && val.startsWith("prod_")) {
        try {
          const product = await stripe.products.retrieve(val);
          const dp = product?.default_price;
          if (typeof dp === "string") return dp;
          if (dp && typeof dp === "object" && dp.id) return dp.id;
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
      return val;
    };
    const priceId = await resolvePriceId(beatId);
    if (!priceId)
      return res
        .status(400)
        .json({ error: "No Stripe Price configured for this beat." });
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
      sessionCreate.discounts = [{ promotion_code: promotionCode }];
    }
    const session = await stripe.checkout.sessions.create(sessionCreate);
    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("[checkout] error", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Downloads
app.get("/api/downloads/:beat/:sessionId", async (req, res) => {
  try {
    const { beat, sessionId } = req.params;
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    if (!supabase)
      return res.status(500).json({ error: "Supabase not configured" });
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
    let files = [];
    let usedFolder = inferredFolder || beat;
    try {
      if (usedFolder) files = await listSignedFiles(usedFolder, 60 * 60);
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
    // Filter out disallowed items (exclude .mp3)
    files = files.filter((f) => isAllowedDownload(f?.name));
    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ error: `No files found for ${usedFolder || beat}` });
    }
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

// Preview
app.get("/api/preview/:beat", async (req, res) => {
  try {
    if (!supabase)
      return res.status(500).json({ error: "Supabase not configured" });
    const { beat } = req.params;
    if (beat !== "lucid")
      return res.status(404).json({ error: "Unknown beat" });
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl("lucid/Lucid.mp3", 60 * 5);
    if (error || !data?.signedUrl)
      return res.status(500).json({ error: "Failed to sign preview URL" });
    if (req.query.redirect === "1") return res.redirect(data.signedUrl);
    return res.json({ url: data.signedUrl });
  } catch (err) {
    console.error("[preview] error", err);
    return res.status(500).json({ error: "Preview failed" });
  }
});

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, frontend: FRONTEND_URL });
});

// Public: expose current Stripe prices mapped to beat keys for UI sync
app.get("/api/prices", async (_req, res) => {
  try {
    if (!stripe)
      return res
        .status(500)
        .json({ ok: false, error: "Stripe not configured" });

    // Build list of known identifiers from env mapping
    const pairs = Array.from(STRIPE_ID_TO_BEAT.entries()); // [ [priceIdOrProdId, beatKey], ... ]
    const out = {};
    await Promise.all(
      pairs.map(async ([stripeId, beatKey]) => {
        try {
          let priceObj = null;
          if (typeof stripeId === "string" && stripeId.startsWith("price_")) {
            priceObj = await stripe.prices.retrieve(stripeId);
          } else if (
            typeof stripeId === "string" &&
            stripeId.startsWith("prod_")
          ) {
            // Resolve product -> default price
            try {
              const product = await stripe.products.retrieve(stripeId);
              const dp = product?.default_price;
              if (typeof dp === "string") {
                priceObj = await stripe.prices.retrieve(dp);
              } else if (dp && typeof dp === "object" && dp.id) {
                priceObj = await stripe.prices.retrieve(dp.id);
              } else {
                const prices = await stripe.prices.list({
                  product: stripeId,
                  active: true,
                  limit: 1,
                });
                priceObj = prices?.data?.[0] || null;
              }
            } catch (e) {
              console.warn(
                "[prices] failed to resolve default price for product",
                stripeId,
                e?.message || e
              );
            }
          }
          if (!priceObj) return;
          const unit =
            typeof priceObj.unit_amount === "number"
              ? priceObj.unit_amount
              : null;
          const currency = priceObj.currency || "usd";
          if (unit === null) return;
          out[beatKey] = {
            unit_amount: unit,
            currency,
            amount: unit / 100,
            price_id: priceObj.id,
            product_id:
              typeof priceObj.product === "string"
                ? priceObj.product
                : priceObj.product?.id || null,
          };
        } catch (e) {
          console.warn(
            "[prices] failed for",
            beatKey,
            stripeId,
            e?.message || e
          );
        }
      })
    );
    return res.json({
      ok: true,
      prices: out,
      count: Object.keys(out).length,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[prices] endpoint error", e);
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Friendly root message to avoid confusion when hitting /
app.get("/", (_req, res) => {
  res
    .type("text/plain")
    .send(
      "KFI Beat Store API is running. Try /api/health or /api/email/transport."
    );
});

// Debug transport endpoints (optional)
app.get("/api/email/transport", (_req, res) => {
  res.json({
    resendConfigured: Boolean(resend),
    resendFrom: getResendFrom() || null,
    resendFromRaw: RAW_RESEND_FROM || null,
    resendFallbackFrom: RESEND_FALLBACK_FROM || null,
    senderMode: SENDER_MODE,
    to: CONTACT_RECIPIENT || null,
    toList: CONTACT_RECIPIENTS || null,
    bcc: CONTACT_BCC || null,
    smtpEnabled,
    smtpFrom: smtpEnabled ? SMTP_FROM : null,
  });
});

// Get/Set sender mode (debug)
app.get("/api/email/sender", (_req, res) => {
  res.json({
    mode: SENDER_MODE,
    effectiveFrom: getResendFrom(),
    rawFrom: RAW_RESEND_FROM || null,
    fallbackFrom: RESEND_FALLBACK_FROM || null,
  });
});
app.post("/api/email/sender", (req, res) => {
  const { mode } = req.body || {};
  const m = String(mode || "").toLowerCase();
  if (!m || !["auto", "onboarding", "branded"].includes(m)) {
    return res
      .status(400)
      .json({ ok: false, error: "mode must be auto|onboarding|branded" });
  }
  SENDER_MODE = m;
  res.json({ ok: true, mode: SENDER_MODE, effectiveFrom: getResendFrom() });
});

app.post("/api/email/test-contact", contactLimiter, async (req, res) => {
  try {
    if (!resend)
      return res
        .status(500)
        .json({ ok: false, error: "Resend not configured" });
    const body = req.body || {};
    let to;
    if (typeof body.to === "string" && body.to.includes("@")) {
      to = body.to.includes(",")
        ? body.to
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : body.to.trim();
    } else {
      const list = (CONTACT_RECIPIENTS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      to = list.length > 0 ? list : (CONTACT_RECIPIENT || "").trim();
    }
    const subject = "Test contact delivery";
    const html = `<p>This is a test contact email sent at ${new Date().toISOString()}.</p>`;
    const text = `Test contact email ${new Date().toISOString()}`;
    // Optional transport override for debugging
    const transport = String(body.transport || "auto").toLowerCase();
    if (transport === "smtp") {
      if (!smtpTransport)
        return res
          .status(400)
          .json({ ok: false, error: "SMTP not configured" });
      try {
        const info = await smtpTransport.sendMail({
          from: SMTP_FROM,
          to: Array.isArray(to) ? to.join(",") : to,
          subject,
          html,
          text,
        });
        return res.json({
          ok: true,
          transport: "smtp",
          id: info?.messageId || null,
          to,
          from: SMTP_FROM,
        });
      } catch (smtpErr) {
        return res
          .status(500)
          .json({ ok: false, error: smtpErr?.message || "SMTP send failed" });
      }
    }

    let r = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject,
      html,
      text,
    });
    if (r?.error) {
      if (RESEND_FALLBACK_FROM && RESEND_FALLBACK_FROM !== getResendFrom()) {
        console.warn(
          "[test-contact] primary error, retrying with fallback",
          r.error
        );
        r = await resend.emails.send({
          from: RESEND_FALLBACK_FROM,
          to,
          subject,
          html,
          text,
        });
        if (r?.error) {
          if (smtpTransport) {
            try {
              const info = await smtpTransport.sendMail({
                from: SMTP_FROM,
                to,
                subject,
                html,
                text,
              });
              console.log(
                "[test-contact] smtp send ok:",
                info?.messageId || null
              );
              return res.json({
                ok: true,
                transport: "smtp",
                to,
                from: SMTP_FROM,
              });
            } catch (smtpErr) {
              return res.status(500).json({
                ok: false,
                error: r.error?.message || smtpErr?.message || "send failed",
              });
            }
          }
          return res
            .status(500)
            .json({ ok: false, error: r.error?.message || "send failed" });
        }
      } else {
        if (smtpTransport) {
          try {
            const info = await smtpTransport.sendMail({
              from: SMTP_FROM,
              to,
              subject,
              html,
              text,
            });
            console.log(
              "[test-contact] smtp send ok:",
              info?.messageId || null
            );
            return res.json({
              ok: true,
              transport: "smtp",
              to,
              from: SMTP_FROM,
            });
          } catch (smtpErr) {
            return res.status(500).json({
              ok: false,
              error: r.error?.message || smtpErr?.message || "send failed",
            });
          }
        }
        return res
          .status(500)
          .json({ ok: false, error: r.error?.message || "send failed" });
      }
    }
    const id = r?.data?.id || r?.id || null;
    return res.json({
      ok: true,
      transport: "resend",
      id,
      to,
      from: getResendFrom(),
    });
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
    const { to, folder, transport: transportIn } = req.body || {};
    if (!to || !folder)
      return res.status(400).json({ ok: false, error: "Missing to or folder" });
    let files = await listSignedFiles(String(folder), 60 * 60); // 1 hour links
    files = files.filter((f) => isAllowedDownload(f?.name));
    const transport = String(transportIn || "auto").toLowerCase();
    if (transport === "smtp") {
      if (!smtpTransport)
        return res
          .status(400)
          .json({ ok: false, error: "SMTP not configured" });
      const itemsHtml = files
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
      const html = `<!doctype html><html><body><table>${itemsHtml}</table></body></html>`;
      const info = await smtpTransport.sendMail({
        from: SMTP_FROM,
        to,
        subject: `Your download: ${folder}`,
        html,
      });
      return res.json({
        ok: true,
        transport: "smtp",
        id: info?.messageId || null,
        to,
        from: SMTP_FROM,
        count: files?.length || 0,
      });
    }

    await sendDownloadEmail({
      to,
      productName: folder,
      files,
      expiresHours: 1,
    });
    return res.json({
      ok: true,
      count: files?.length || 0,
      to,
      from: getResendFrom(),
    });
  } catch (e) {
    console.error("[test-download] error", e);
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});
// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
