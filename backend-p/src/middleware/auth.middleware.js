// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function extractToken(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h) return null;
  const [scheme, token] = String(h).split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

const asArray = (x) => (Array.isArray(x) ? x : x != null ? [x] : []);

export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ ok: false, error: "no_token" });

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const rolesRaw = asArray(payload.roles ?? payload.role);
    const permsRaw = asArray(payload.perms ?? payload.permissions);

    req.user = {
      sub: String(payload.sub ?? ""),
      vit_id: payload.vit_id ?? null,
      roles: rolesRaw.map((r) => String(r).toLowerCase()),
      perms: permsRaw.map((p) => String(p)),
      _raw: payload,
    };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "invalid_token" });
  }
}
