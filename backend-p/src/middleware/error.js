// src/middleware/error.js
/**
 * Global error handler — returns consistent JSON.
 */
export default function errorHandler(err, _req, res, _next) {
  console.error("[ERROR]", err);
  const status = Number(err.status) || 500;
  const message = err.message || "Server error";
  res.status(status).json({ ok: false, error: message });
}
