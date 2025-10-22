// 404 handler
export function notFound(_req, res, _next) {
  res.status(404).json({ error: "Not found" });
}

// Centralized error handler
export function errorHandler(err, _req, res, _next) {
  const status = err?.status || 500;
  const message = err?.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") {
    // log stack in development
    console.error("[error]", err);
  }
  res.status(status).json({ error: message });
}
