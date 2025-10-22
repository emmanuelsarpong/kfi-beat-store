import helmet from "helmet";
import compression from "compression";
import cors from "cors";

export function securityHeaders() {
  return helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
}

export function gzipCompression() {
  return compression();
}

export function corsPolicy() {
  // Build allowlist from env
  const envFront = process.env.FRONTEND_URL?.trim();
  const additional = process.env.ORIGIN_WHITELIST || ""; // comma-separated
  const list = [envFront, ...additional.split(",")]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/$/, ""));

  // In dev, allow localhost dev servers
  if (process.env.NODE_ENV !== "production") {
    // Keep common vite port, but also allow any localhost/127.* port to avoid dev CORS issues
    list.push("http://localhost:5173", "http://127.0.0.1:5173");
  }

  const allowlist = Array.from(new Set(list));

  return cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // curl/postman
      const o = origin.replace(/\/$/, "");
      if (allowlist.includes(o)) return callback(null, true);
      if (process.env.NODE_ENV !== "production") {
        // Allow any localhost or 127.x.x.x origin in development
        if (/^http:\/\/(localhost|127(?:\.\d+){0,3})(?::\d+)?$/i.test(o)) {
          return callback(null, true);
        }
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  });
}
