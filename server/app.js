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
import {
  ensureBeatRow,
  ensureAllStoreBeats,
  getStoreBeatTitle,
  isStoreBeatId,
  STORE_BEATS,
} from "./beatsStore.js";

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
// Generic lease prices via Stripe Price IDs (shared across beats)
// Required for Starter/Premium/Unlimited checkout. If unset, those license types return 400.
const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER;
const STRIPE_PRICE_PREMIUM = process.env.STRIPE_PRICE_PREMIUM;
const STRIPE_PRICE_UNLIMITED = process.env.STRIPE_PRICE_UNLIMITED;
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
const PURCHASES_TABLE = "purchases";
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

/**
 * Lightweight check: does this beat folder have stems available?
 * We assume stems live under "<folder>/stems" or as "Stems.zip".
 * Tries the folder as-is, then with spaces replaced by hyphens (e.g. "give me love" -> "give-me-love").
 * @param {string} folder - folder name (e.g. "sunrise")
 * @param {{ beatId?: string, title?: string, debug?: boolean }} opts - optional; when debug true, logs list/exists results
 */
async function hasStemsForFolder(folder, opts = {}) {
  if (!supabase) return false;
  const base = String(folder || "").trim();
  if (!base) return false;
  const folderVariants = [
    base,
    base.replace(/\s+/g, "-"),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const debug = opts.debug === true;
  for (const variant of folderVariants) {
    const found = await hasStemsInFolder(variant, { debug, ...opts });
    if (found) return true;
  }
  if (debug) {
    console.log("[availability] beat=" + (opts.beatId ?? "?") + " title=" + (opts.title ?? "?") + " folder=" + folder + " hasStems=false");
  }
  return false;
}

function itemIsStemsZip(item) {
  const name = String(item?.name ?? "").toLowerCase();
  return name === "stems.zip" || name.endsWith("/stems.zip");
}

/**
 * @param {string} base - folder path
 * @param {{ debug?: boolean, beatId?: string, title?: string }} opts
 */
async function hasStemsInFolder(base, opts = {}) {
  const baseClean = base.replace(/\/+$/, "");
  const stemsZipPath = `${baseClean}/Stems.zip`;
  const stemsPrefix = `${baseClean}/stems`;
  const debug = opts.debug === true;

  try {
    const { data: stemsEntries, error: stemsErr } = await supabase.storage
      .from(BUCKET)
      .list(stemsPrefix, { limit: 1 });
    if (!stemsErr && Array.isArray(stemsEntries) && stemsEntries.length > 0) {
      if (debug) console.log("[availability] folder=" + baseClean + " list(stems/)=ok count=" + stemsEntries.length + " exists=skip hasStems=true");
      return true;
    }
  } catch (_) {}

  let listErr = null;
  let listCount = 0;
  let listFoundStems = false;
  try {
    const { data: rootEntries, error: rootErr } = await supabase.storage
      .from(BUCKET)
      .list(baseClean, { limit: 50 });
    listErr = rootErr ? (rootErr.message || String(rootErr)) : null;
    listCount = Array.isArray(rootEntries) ? rootEntries.length : 0;
    listFoundStems = !rootErr && Array.isArray(rootEntries) && rootEntries.some(itemIsStemsZip);
    if (listFoundStems) {
      if (debug) console.log("[availability] folder=" + baseClean + " list()=ok count=" + listCount + " foundStemsZip=true exists=skip hasStems=true");
      return true;
    }
    if (rootErr) {
      console.warn("[stems] storage list failed for folder:", baseClean, rootErr.message || rootErr);
    }
  } catch (e) {
    listErr = e?.message || String(e);
    console.warn("[stems] storage list threw for folder:", baseClean, e?.message || e);
  }

  let existsResult = false;
  try {
    const { data: exists } = await supabase.storage.from(BUCKET).exists(stemsZipPath);
    existsResult = exists === true;
    if (existsResult) {
      if (debug) console.log("[availability] folder=" + baseClean + " list()=" + (listErr || "ok") + " count=" + listCount + " exists(" + stemsZipPath + ")=true hasStems=true");
      return true;
    }
  } catch (_) {}
  if (debug) {
    console.log("[availability] folder=" + baseClean + " list()=" + (listErr || "ok") + " count=" + listCount + " exists(" + stemsZipPath + ")=" + existsResult + " hasStems=false");
  }
  return false;
}

// Only allow certain file types in customer-facing downloads (blocks preview MP3)
function isAllowedDownload(name) {
  const n = String(name || "").toLowerCase();
  return n.endsWith(".wav") || n.endsWith(".zip");
}

/**
 * License-aware file selection for fulfillment.
 * Used by both webhook email and GET /api/downloads so email and success page always match.
 * @param {Array<{ name: string, path?: string, url?: string }>} files - result of listSignedFiles (or similar)
 * @param {string} licenseType - "starter" | "premium" | "unlimited" | "exclusive"
 * @returns {Array} filtered list allowed for that license. Preview MP3 is never included.
 */
function selectDeliverableFiles(files, licenseType) {
  const raw = Array.isArray(files) ? files : [];
  const lt = String(licenseType || "").toLowerCase();
  const isWavOnly = lt === "starter" || lt === "premium";

  return raw.filter((f) => {
    if (!f || !f.name) return false;
    const name = String(f.name).toLowerCase();
    const path = String(f.path ?? "").toLowerCase();
    // Preview MP3 must never be delivered
    if (name.endsWith(".mp3")) return false;
    // WAV: include for all tiers; for starter/premium exclude files under stems/ (master WAV only)
    if (name.endsWith(".wav")) {
      if (isWavOnly && path.includes("/stems/")) return false;
      return true;
    }
    // ZIP: starter/premium get no zip; unlimited/exclusive get stems-related zip only
    if (name.endsWith(".zip")) {
      if (isWavOnly) return false;
      return name === "stems.zip" || path.includes("/stems/");
    }
    // Other types (e.g. under stems/): only for unlimited/exclusive
    if (isWavOnly) return false;
    return path.includes("/stems/");
  });
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

/** License tier product names that must NOT be used as beat folder names */
const LICENSE_TIER_NAMES = new Set([
  "starter license",
  "premium license",
  "unlimited license",
  "exclusive license",
  "starter",
  "premium",
  "unlimited",
  "exclusive",
]);

function isLicenseTierProductName(name) {
  if (typeof name !== "string" || !name.trim()) return false;
  const normalized = String(name).trim().toLowerCase();
  return LICENSE_TIER_NAMES.has(normalized) || /\b(starter|premium|unlimited|exclusive)\s+license\b/i.test(normalized);
}

/**
 * Resolve the correct beat folder name inside the `beats` bucket.
 * Prefers title-based matching; never uses Stripe product name when it's a license tier.
 * @param {{ beatId?: string, beatTitle?: string, productName?: string }} opts
 * @returns {{ folder: string | null, tried: string[] }}
 */
async function resolveBeatFolder(opts = {}) {
  const { beatId, beatTitle, productName } = opts;
  const tried = [];
  const title = typeof beatTitle === "string" ? beatTitle.trim() : null;
  const id = beatId != null ? String(beatId) : null;

  // 1) Title-based candidates first (lowercase, exact trim, slugified if different)
  if (title) {
    const lower = title.toLowerCase();
    if (lower && !tried.includes(lower)) tried.push(lower);
    const exact = title;
    if (exact && exact !== lower && !tried.includes(exact)) tried.push(exact);
    const slug = slugifyTitleToFolder(title);
    if (slug && !tried.includes(slug)) tried.push(slug);
  }

  // 2) Product name only if it's NOT a license tier (e.g. beat name from Stripe)
  if (typeof productName === "string" && productName.trim() && !isLicenseTierProductName(productName)) {
    const fromProduct = slugifyTitleToFolder(productName);
    if (fromProduct && !tried.includes(fromProduct)) tried.push(fromProduct);
  }

  // 3) Beat id as last resort
  if (id && !tried.includes(id)) tried.push(id);
  const idLower = id ? id.toLowerCase() : null;
  if (idLower && idLower !== id && !tried.includes(idLower)) tried.push(idLower);

  console.log("[delivery] beatId=" + (id ?? "?") + " beatTitle=" + (title ?? "?"));
  console.log("[delivery] candidates tried: " + JSON.stringify(tried));

  if (!supabase) return { folder: tried[0] || null, tried };

  for (const candidate of tried) {
    const prefix = String(candidate).trim();
    if (!prefix) continue;
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1 });
    if (!error) {
      console.log("[delivery] resolved folder: " + prefix);
      return { folder: prefix, tried };
    }
  }

  const fallback = tried[0] || null;
  if (fallback) console.log("[delivery] resolved folder (fallback): " + fallback);
  else console.warn("[delivery] no folder resolved");
  return { folder: fallback, tried };
}

/**
 * List files only inside the given beat folder (one level, no recursion).
 * @param {string} folder - folder name inside beats bucket
 * @returns {Promise<Array<{ name: string, path: string }>>}
 */
async function listFilesInBeatFolder(folder) {
  if (!supabase || !folder || !String(folder).trim()) return [];
  const prefix = String(folder).trim().replace(/\/+$/, "");
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100 });
  if (error) throw error;
  const items = Array.isArray(data) ? data : [];
  const files = [];
  for (const item of items) {
    const name = item?.name;
    if (!name || name.startsWith(".")) continue;
    const isFile = item?.metadata?.mimetype != null;
    if (!isFile) continue;
    const path = `${prefix}/${name}`;
    files.push({ name, path });
  }
  return files;
}

/**
 * Categorize files from a beat folder into preview MP3, master WAV, and Stems.zip.
 * Deterministic: one previewMp3 (.mp3), one masterWav (.wav), one stemsZip (Stems.zip case-insensitive).
 * @param {Array<{ name: string, path: string }>} files
 * @returns {{ previewMp3: { name: string, path: string } | null, masterWav: { name: string, path: string } | null, stemsZip: { name: string, path: string } | null }}
 */
function categorizeBeatFiles(files) {
  let previewMp3 = null;
  let masterWav = null;
  let stemsZip = null;
  const raw = Array.isArray(files) ? files : [];
  for (const f of raw) {
    const name = f?.name;
    const path = f?.path;
    if (!name || !path) continue;
    const lower = name.toLowerCase();
    if (lower.endsWith(".mp3")) previewMp3 = { name, path };
    else if (lower.endsWith(".wav")) masterWav = { name, path };
    else if (lower === "stems.zip") stemsZip = { name, path };
  }
  return { previewMp3, masterWav, stemsZip };
}

/**
 * Get deliverable file refs by license. Preview MP3 is never delivered.
 * starter/premium: masterWav only.
 * unlimited/exclusive: masterWav + stemsZip.
 * @param {{ previewMp3: object | null, masterWav: object | null, stemsZip: object | null }} categorized
 * @param {string} licenseType
 * @returns {Array<{ name: string, path: string }>}
 */
function getDeliverableRefsForLicense(categorized, licenseType) {
  const lt = String(licenseType || "").toLowerCase();
  const out = [];
  if (categorized.masterWav) out.push(categorized.masterWav);
  if (lt === "unlimited" || lt === "exclusive") {
    if (categorized.stemsZip) out.push(categorized.stemsZip);
  }
  return out;
}

/**
 * Create signed URLs for deliverable files only. Used by webhook and GET /api/downloads.
 * @param {Array<{ name: string, path: string }>} refs
 * @param {number} expiresSec
 * @returns {Promise<Array<{ name: string, path: string, url: string }>>}
 */
async function createSignedUrlsForRefs(refs, expiresSec) {
  if (!supabase) return [];
  const result = [];
  for (const ref of refs) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ref.path, expiresSec);
    if (error) throw error;
    if (data?.signedUrl) result.push({ name: ref.name, path: ref.path, url: data.signedUrl });
  }
  return result;
}

/**
 * Single fulfillment flow: resolve folder, list files, categorize, filter by license, sign URLs.
 * Used by both webhook and GET /api/downloads so email and success page always match.
 * @param {{ beatId?: string, beatTitle?: string, productName?: string }} folderOpts
 * @param {string} licenseType
 * @param {number} expiresSec
 * @returns {Promise<{ files: Array<{ name: string, path: string, url: string }>, folder: string | null }>}
 */
async function getFulfillmentFiles(folderOpts, licenseType, expiresSec) {
  const { folder, tried } = await resolveBeatFolder(folderOpts);
  if (!folder) return { files: [], folder: null };

  const rawFiles = await listFilesInBeatFolder(folder);
  const fileNames = rawFiles.map((f) => f.name);
  console.log("[delivery] files found: " + JSON.stringify(fileNames));

  const categorized = categorizeBeatFiles(rawFiles);
  const refs = getDeliverableRefsForLicense(categorized, licenseType);
  const deliverNames = refs.map((r) => r.name);
  console.log("[delivery] licenseType=" + (licenseType || "starter"));
  console.log("[delivery] delivering: " + JSON.stringify(deliverNames));

  const files = await createSignedUrlsForRefs(refs, expiresSec);
  return { files, folder };
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

// --- Stripe webhook processing ---
// Production goals:
// - Verify signature using the *raw* request body (must run before express.json()).
// - Respond 200 ASAP to avoid Stripe retries/timeouts.
// - Run business logic asynchronously and protect against duplicate event delivery.
const PROCESSED_STRIPE_EVENT_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const processedStripeEvents = new Map(); // eventId -> processedAtMs
function markStripeEventProcessed(id) {
  if (!id) return;
  processedStripeEvents.set(String(id), Date.now());
}
function hasStripeEventBeenProcessed(id) {
  if (!id) return false;
  const ts = processedStripeEvents.get(String(id));
  if (typeof ts !== "number") return false;
  if (Date.now() - ts > PROCESSED_STRIPE_EVENT_TTL_MS) {
    processedStripeEvents.delete(String(id));
    return false;
  }
  return true;
}
function pruneProcessedStripeEvents() {
  const now = Date.now();
  for (const [id, ts] of processedStripeEvents.entries()) {
    if (typeof ts !== "number" || now - ts > PROCESSED_STRIPE_EVENT_TTL_MS) {
      processedStripeEvents.delete(id);
    }
  }
}

async function processStripeEvent(event) {
  const eventId = event?.id || "unknown";
  const eventType = event?.type || "unknown";
  try {
    if (!event || !event.type) {
      console.warn("[webhook] invalid event payload", { eventId, eventType });
      return;
    }

    // Handle "at least once" delivery: Stripe may retry the same event id.
    if (hasStripeEventBeenProcessed(eventId)) {
      console.info("[webhook] duplicate ignored", { eventId, eventType });
      return;
    }
    // Opportunistic cleanup (bounded by TTL)
    pruneProcessedStripeEvents();
    markStripeEventProcessed(eventId);

    // Keep existing business logic for checkout completion, but run it async.
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      let email = session?.customer_details?.email || session?.customer_email;
      const meta = session?.metadata || {};
      const licenseType = meta.license_type || null;
      const beatIdMeta = meta.beat_id || meta.beat || session?.client_reference_id;

      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });
      if (!email) email = full?.customer_details?.email || email;

      const item = full?.line_items?.data?.[0];
      const price = item?.price;
      const product = price?.product;
      const priceId = price?.id;
      const productId = typeof product === "object" ? product?.id : undefined;
      const productName = typeof product === "object" ? product?.name : undefined;

      const beatKey =
        beatIdMeta ||
        STRIPE_ID_TO_BEAT.get(priceId) ||
        STRIPE_ID_TO_BEAT.get(productId) ||
        null;

      // Persist purchase record (idempotent by checkout session id)
      try {
        if (supabase && PURCHASES_TABLE) {
          const amountTotal =
            session?.amount_total ??
            full?.amount_total ??
            (typeof price?.unit_amount === "number" ? price.unit_amount : null);
          const currency =
            session?.currency || full?.currency || price?.currency || "usd";
          const paymentIntentId =
            typeof session?.payment_intent === "string"
              ? session.payment_intent
              : session?.payment_intent?.id || null;
          const { error: upsertErr } = await supabase
            .from(PURCHASES_TABLE)
            .upsert(
              {
                stripe_checkout_session_id: session.id,
                stripe_payment_intent_id: paymentIntentId,
                buyer_email: email || null,
                beat_id: beatKey || beatIdMeta || null,
                beat_title_snapshot: meta.beat_title || productName || null,
                license_type: licenseType,
                amount_total: amountTotal,
                currency,
                payment_status: session?.payment_status || session?.status,
                raw_metadata: meta,
                stripe_price_id: priceId || null,
                stripe_product_id: productId || null,
                product_name_snapshot: productName || null,
              },
              { onConflict: "stripe_checkout_session_id" }
            );
          if (upsertErr) console.error("[webhook] purchase upsert failed", upsertErr);
        }
      } catch (e) {
        console.error("[webhook] purchase persistence error", e?.stack || e);
      }

      const beatTitleWebhook =
        getStoreBeatTitle(beatKey) || meta.beat_title || null;
      let files = [];
      try {
        const result = await getFulfillmentFiles(
          { beatId: beatKey, beatTitle: beatTitleWebhook, productName },
          licenseType || "starter",
          60 * 60 * 24
        );
        files = result.files;
      } catch (e) {
        console.error(
          "[webhook] failed to sign files for",
          beatKey,
          e?.message || e
        );
      }

      if (!email) {
        console.warn("[webhook] no customer email present", { sessionId: session?.id });
      }

      if (email && files.length > 0) {
        try {
          await sendDownloadEmail({
            to: email,
            productName: productName || "Your Beat",
            files,
            expiresHours: 24,
          });
          try {
            SENT_SESSIONS.add(session.id);
          } catch {}
        } catch (e) {
          // Email failures should never cause Stripe retries.
          console.error("[webhook] email send failed", e?.stack || e);
        }
      }

      // Update beat availability (idempotent + sold-safe)
      try {
        if (supabase) {
          const isLease =
            licenseType === "starter" ||
            licenseType === "premium" ||
            licenseType === "unlimited";
          const isExclusive = licenseType === "exclusive";
          const nowIso = new Date().toISOString();

          if (isLease) {
            if (beatKey) {
              const { data: row } = await supabase
                .from("beats")
                .select("sold, exclusive_available, first_lease_at")
                .eq("id", beatKey)
                .maybeSingle();
              if (row && row.sold) {
                console.info("[webhook] lease ignored, beat already sold", { beatId: beatKey });
              } else if (row && row.exclusive_available === false && row.first_lease_at) {
                // idempotent no-op (replay-safe)
              } else if (row) {
                await supabase
                  .from("beats")
                  .update({
                    exclusive_available: false,
                    first_lease_at: row.first_lease_at ?? nowIso,
                  })
                  .eq("id", beatKey);
              }
            } else if (productName) {
              const { data: rows } = await supabase
                .from("beats")
                .select("id, sold, exclusive_available, first_lease_at")
                .ilike("title", productName)
                .limit(1);
              const row = rows?.[0];
              if (row && row.sold) {
                console.info("[webhook] lease ignored, beat already sold", { title: productName });
              } else if (row && row.exclusive_available === false && row.first_lease_at) {
                // idempotent no-op (replay-safe)
              } else if (row) {
                await supabase
                  .from("beats")
                  .update({
                    exclusive_available: false,
                    first_lease_at: row.first_lease_at ?? nowIso,
                  })
                  .eq("id", row.id);
              }
            }
          } else if (isExclusive) {
            if (beatKey) {
              const { data: row, error: fetchErr } = await supabase
                .from("beats")
                .select("sold, sold_at")
                .eq("id", beatKey)
                .maybeSingle();
              if (fetchErr) {
                console.error("[webhook] sold check failed", fetchErr);
              } else if (row && row.sold) {
                console.info("[webhook] exclusive replay, already sold", { beatId: beatKey });
              } else if (row) {
                const { error: upErr } = await supabase
                  .from("beats")
                  .update({
                    sold: true,
                    sold_at: row.sold_at ?? nowIso,
                    exclusive_available: false,
                  })
                  .eq("id", beatKey)
                  .eq("sold", false);
                if (upErr) console.error("[webhook] exclusive update failed", upErr);
              }
            } else if (productName) {
              const { data: rows } = await supabase
                .from("beats")
                .select("id, sold, sold_at")
                .ilike("title", productName)
                .limit(1);
              const row = rows?.[0];
              if (row && row.sold) {
                console.info("[webhook] exclusive replay, already sold", { title: productName });
              } else if (row) {
                const { error: upErr2 } = await supabase
                  .from("beats")
                  .update({
                    sold: true,
                    sold_at: row.sold_at ?? nowIso,
                    exclusive_available: false,
                  })
                  .eq("id", row.id)
                  .eq("sold", false);
                if (upErr2) console.error("[webhook] exclusive update failed (title)", upErr2);
              }
            }
          }
        }
      } catch (e) {
        console.error("[webhook] beat availability update failed", e?.stack || e);
      }

      console.info("[webhook] processed", { eventId, eventType, sessionId: session?.id });
      return;
    }

    // Minimal safe handling for payment_intent.succeeded (often useful for future reconciliation)
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      console.info("[webhook] payment_intent.succeeded", {
        eventId,
        paymentIntentId: pi?.id || null,
        amount: pi?.amount_received ?? pi?.amount ?? null,
        currency: pi?.currency || null,
      });
      return;
    }

    console.info("[webhook] unhandled event type", { eventId, eventType });
  } catch (e) {
    // IMPORTANT: processing failures should never cause non-200 responses.
    console.error("[webhook] processing failed", {
      eventId,
      eventType,
      error: e?.message || String(e),
      stack: e?.stack || null,
    });
  }
}

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
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(
        "[webhook] signature verification failed",
        err?.message || err
      );
      return res.sendStatus(400);
    }

    // ACK immediately. Processing happens async so Stripe delivery does not fail due to slow work.
    res.status(200).send();

    // Process asynchronously. Errors are logged but never affect the already-sent response.
    setImmediate(() => {
      processStripeEvent(event).catch((e) => {
        console.error("[webhook] async processor crashed", e?.stack || e);
      });
    });
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
      beatTitle,
      licenseType = "exclusive",
      returnUrl = FRONTEND_URL,
      promotionCode,
    } = req.body || {};
    const allowedLicenseTypes = [
      // New canonical license keys
      "starter",
      "premium",
      "unlimited",
      "exclusive",
      // Backwards-compatible aliases from older frontends
      "mp3",
      "wav",
    ];
    if (!beatId || typeof beatId !== "string") {
      return res.status(400).json({ error: "beatId is required" });
    }
    if (
      !licenseType ||
      typeof licenseType !== "string" ||
      !allowedLicenseTypes.includes(licenseType)
    ) {
      return res.status(400).json({ error: "Invalid licenseType" });
    }
    // Normalize legacy license values to new canonical keys
    let normalizedLicenseType = licenseType;
    if (normalizedLicenseType === "mp3") normalizedLicenseType = "starter";
    else if (normalizedLicenseType === "wav")
      normalizedLicenseType = "premium";
    const resolveExclusivePriceId = async (id) => {
      if (!id) return undefined;
      const map = {
        lucid: STRIPE_PRICE_ID_LUCID,
        1: STRIPE_PRICE_ID_LUCID,
        sunset: process.env.STRIPE_PRICE_ID_SUNSET,
        29: process.env.STRIPE_PRICE_ID_29,
        "35": process.env.STRIPE_PRICE_ID_35, // Cloudy Days
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
    // Determine Stripe price based on license type
    let priceId;
    if (normalizedLicenseType === "starter") {
      priceId = STRIPE_PRICE_STARTER;
    } else if (normalizedLicenseType === "premium") {
      priceId = STRIPE_PRICE_PREMIUM;
    } else if (normalizedLicenseType === "unlimited") {
      priceId = STRIPE_PRICE_UNLIMITED;
    } else {
      // Some beats are lease-only (no exclusive)
      if (String(beatId) === "37") {
        return res
          .status(400)
          .json({ error: "Exclusive license not available for this beat." });
      }
      priceId = await resolveExclusivePriceId(beatId);
    }
    if (!priceId || typeof priceId !== "string") {
      const leaseMissing =
        (normalizedLicenseType === "starter" && !STRIPE_PRICE_STARTER) ||
        (normalizedLicenseType === "premium" && !STRIPE_PRICE_PREMIUM) ||
        (normalizedLicenseType === "unlimited" && !STRIPE_PRICE_UNLIMITED);
      return res.status(400).json({
        error:
          normalizedLicenseType === "exclusive"
            ? "No Stripe Price configured for this beat."
            : leaseMissing
              ? "Starter, Premium, or Unlimited checkout is not configured. Set STRIPE_PRICE_STARTER, STRIPE_PRICE_PREMIUM, and STRIPE_PRICE_UNLIMITED in the server environment."
              : "Requested license is temporarily unavailable.",
      });
    }
    // Require beat row for availability check; backfill if missing (store beats only), then reject if still missing.
    let existing = null;
    if (supabase) {
      try {
        let { data, error: beatErr } = await supabase
          .from("beats")
          .select("sold, exclusive_available")
          .eq("id", beatId)
          .maybeSingle();
        existing = data;
        if (beatErr) {
          console.error("[checkout] beat lookup failed", beatErr);
        }
        if (!existing && isStoreBeatId(beatId)) {
          await ensureBeatRow(supabase, beatId, beatTitle);
          const refetch = await supabase
            .from("beats")
            .select("sold, exclusive_available")
            .eq("id", beatId)
            .maybeSingle();
          existing = refetch.data;
        }
        if (!existing) {
          if (isStoreBeatId(beatId)) {
            console.warn("[checkout] beat row missing after ensure beatId=", beatId);
            return res.status(503).json({
              error: "This beat is temporarily unavailable. Please try again shortly.",
            });
          }
          return res.status(400).json({
            error: "This beat is not available for purchase.",
          });
        }
        // Rule: if sold, block all license types (starter, premium, unlimited, exclusive)
        if (existing.sold) {
          console.info("[checkout] rejected sold beat beatId=", beatId);
          return res.status(409).json({
            error: "This beat has already been sold exclusively.",
          });
        }
        // Rule: if exclusive requested but exclusive_available is false (e.g. after any lease), block
        if (normalizedLicenseType === "exclusive" && existing.exclusive_available === false) {
          console.info("[checkout] rejected exclusive unavailable beatId=", beatId);
          return res.status(409).json({
            error: "This beat is no longer available for exclusive purchase.",
          });
        }
      } catch (e) {
        console.error("[checkout] beat guard error", e);
        return res.status(503).json({
          error: "Unable to verify beat availability. Please try again.",
        });
      }
    }

    // For Unlimited, ensure stems actually exist; do not silently fall back to WAV-only
    if (normalizedLicenseType === "unlimited" && supabase) {
      try {
        const folderFromTitle = beatTitle
          ? slugifyTitleToFolder(beatTitle)
          : null;
        const folder =
          folderFromTitle ||
          (typeof beatId === "string" ? String(beatId).toLowerCase() : null);
        if (!folder) {
          return res.status(400).json({
            error:
              "Unlimited License is not available for this beat (missing stems configuration).",
          });
        }
        const stemsAvailable = await hasStemsForFolder(folder);
        if (!stemsAvailable) {
          return res.status(409).json({
            error: "Stems are not available for this beat.",
          });
        }
      } catch (e) {
        console.error("[checkout] stems availability check failed", e);
        return res.status(400).json({
          error:
            "Unlimited License is not available for this beat at the moment.",
        });
      }
    }

    // Inspect price for mode + snapshot
    let priceObject = null;
    const baseSessionCreate = {
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}/download?session_id={CHECKOUT_SESSION_ID}&beat=${encodeURIComponent(
        String(beatId)
      )}&license=${encodeURIComponent(normalizedLicenseType)}`,
      cancel_url: `${returnUrl}/`,
      client_reference_id: String(beatId),
      metadata: {
        beat: String(beatId),
        beat_id: String(beatId),
        beat_title: typeof beatTitle === "string" ? beatTitle : "",
        license_type: normalizedLicenseType,
      },
      allow_promotion_codes: true,
    };
    if (promotionCode && typeof promotionCode === "string") {
      baseSessionCreate.discounts = [{ promotion_code: promotionCode }];
    }

    // Some beats may use recurring (subscription) prices (e.g., leases). Stripe
    // requires mode="subscription" for recurring prices, and mode="payment" for one-time.
    let mode = "payment";
    try {
      priceObject = await stripe.prices.retrieve(priceId);
      if (priceObject?.recurring) mode = "subscription";
      if (
        licenseType === "exclusive" &&
        priceObject &&
        typeof priceObject.unit_amount === "number"
      ) {
        baseSessionCreate.metadata.exclusive_price_snapshot =
          String(priceObject.unit_amount);
      }
    } catch {
      // If price lookup fails, we'll attempt payment first and fall back below.
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        ...baseSessionCreate,
        mode,
      });
    } catch (e) {
      // Fallback: if we guessed wrong, retry with subscription mode.
      const msg = String(e?.message || "");
      const shouldRetrySubscription =
        mode !== "subscription" &&
        /recurring|subscription|mode/i.test(msg);
      if (!shouldRetrySubscription) throw e;
      session = await stripe.checkout.sessions.create({
        ...baseSessionCreate,
        mode: "subscription",
      });
    }
    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    const errMsg = err?.message || String(err);
    console.error("[checkout] error", err);
    const safeMsg =
      errMsg && typeof errMsg === "string"
        ? errMsg.slice(0, 400)
        : "Failed to create checkout session";
    return res.status(500).json({ error: safeMsg });
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
    const licenseType =
      (session?.metadata && session.metadata.license_type) || null;
    const customerEmail =
      session?.customer_details?.email || session?.customer_email || null;
    const beatTitle = getStoreBeatTitle(beat);
    let files = [];
    let usedFolder = null;
    try {
      const result = await getFulfillmentFiles(
        {
          beatId: beat,
          beatTitle: beatTitle || session?.metadata?.beat_title || null,
          productName,
        },
        licenseType || "starter",
        60 * 60
      );
      files = result.files;
      usedFolder = result.folder;
    } catch (e) {
      console.error("[downloads] error", e);
      return res
        .status(500)
        .json({ error: "Failed to generate download URLs" });
    }
    if (!files || files.length === 0) {
      console.warn(
        "[downloads] no files after fulfillment",
        "beat=" + beat,
        "folder=" + usedFolder,
        "licenseType=" + licenseType
      );
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

// Public: beat availability (sold, exclusive_available) for UI sync. Syncs store beats so every store beat has a row.
app.get("/api/beat-availability", async (_req, res) => {
  try {
    if (!supabase)
      return res
        .status(500)
        .json({ ok: false, error: "Supabase not configured" });
    await ensureAllStoreBeats(supabase);
    const { data: rows, error } = await supabase
      .from("beats")
      .select("id, sold, exclusive_available");
    if (error) {
      console.error("[beat-availability] query failed", error);
      return res
        .status(500)
        .json({ ok: false, error: error?.message || "Query failed" });
    }
    const availability = {};
    for (const row of rows || []) {
      const id = row?.id != null ? String(row.id) : null;
      if (id)
        availability[id] = {
          sold: Boolean(row.sold),
          exclusive_available: row.exclusive_available !== false,
        };
    }
    // Ensure every store beat has an entry. If row still missing after sync, do not assume Exclusive available.
    for (const { id } of STORE_BEATS) {
      if (availability[id] == null) {
        availability[id] = { sold: false, exclusive_available: false };
      }
    }
    // Derive hasStems from storage (Stems.zip or stems/ folder) per store beat
    const stemsChecks = await Promise.all(
      STORE_BEATS.map(async ({ id, title }) => {
        const folder = slugifyTitleToFolder(title);
        const debug = id === "39" || process.env.DEBUG_AVAILABILITY === "1";
        const hasStems = await hasStemsForFolder(folder, { beatId: id, title, debug });
        return { id, title, folder, hasStems };
      })
    );
    for (const { id, title, folder, hasStems } of stemsChecks) {
      availability[id] = { ...availability[id], hasStems };
      if (id === "39" || process.env.DEBUG_AVAILABILITY === "1") {
        console.log("[availability] beat=" + id + " title=" + title + " folder=" + folder + " hasStems=" + hasStems);
      }
    }
    return res.json({
      ok: true,
      availability,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[beat-availability] error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || String(e) });
  }
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
