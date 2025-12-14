// src/middleware/audit.js
import crypto from "crypto";

/**
 * Attaches a correlation ID (cid) and logs the request line.
 * Use together with route-level logs to trace flows end-to-end.
 */
export function audit(req, _res, next) {
  req.cid = crypto.randomUUID();
  console.log(`[AUDIT] ${req.method} ${req.originalUrl}  cid=${req.cid}`);
  next();
}
