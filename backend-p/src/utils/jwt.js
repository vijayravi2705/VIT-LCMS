// backend-p/src/utils/jwt.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ✅ Generate a new token (used in login controller)
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
}

// ✅ Verify a token (used for protected API routes)
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return null;
  }
}
