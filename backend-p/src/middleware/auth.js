// src/middleware/auth.js
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

export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
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
  } catch {} // ignore and proceed unauthenticated
  next();
}

export function requireRole(...allowed) {
  const need = new Set(allowed.map((r) => String(r).toLowerCase()));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "no_token" });
    const roles = (req.user.roles || []).map((r) => String(r).toLowerCase());
    const ok = roles.some((r) => need.has(r));
    if (!ok) return res.status(403).json({ ok: false, error: "forbidden_role" });
    next();
  };
}

export function requirePerm(perm) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "no_token" });
    const ok = (req.user.perms || []).includes(String(perm));
    if (!ok) return res.status(403).json({ ok: false, error: "forbidden_perm" });
    next();
  };
}

export function requireAnyPerm(...perms) {
  const need = new Set(perms.map(String));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "no_token" });
    const has = (req.user.perms || []).some((p) => need.has(String(p)));
    if (!has) return res.status(403).json({ ok: false, error: "forbidden_perm" });
    next();
  };
}

export const auth = requireAuth;
