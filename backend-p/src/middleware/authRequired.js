// src/middleware/authrequired.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "no_token" });

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = payload; // { sub, vit_id, roles, perms, iat, exp, ... }
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "invalid_token" });
  }
}
