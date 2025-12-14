// src/middleware/rateLimit.js
import rateLimit from "express-rate-limit";

/** Global, gentle limiter for /api */
export const baseLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 100, // 100 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter limiter for login */
export const loginLimiter = rateLimit({
  windowMs: 5 * 60_000, // 5 minutes
  max: 5, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many login attempts. Try again later." },
});
