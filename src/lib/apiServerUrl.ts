/**
 * Base URL for the Express API (checkout, downloads, etc.).
 * In local dev we prefer relative `/api` calls so Vite can proxy to the
 * backend, which also keeps local-network testing working cleanly.
 */
export function getApiServerUrl(): string {
  const envServer =
    ((import.meta.env.VITE_SERVER_URL as string | undefined) || "").trim();
  if (envServer) return envServer.replace(/\/$/, "");
  if (import.meta.env.DEV) return "";
  try {
    return window.location.origin;
  } catch {
    return "";
  }
}
