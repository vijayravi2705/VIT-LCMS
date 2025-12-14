// src/middleware/rbac.js
import { getPermissions, hasAnyPerm } from "../services/rbac.service.js";

export function attachPermsIfMissing(req, _res, next) {
  if (req.user && (!req.user.perms || req.user.perms.length === 0)) {
    const roles = (req.user.roles || []).map(r => String(r).toLowerCase());
    req.user.perms = getPermissions(roles);
  }
  next();
}

export function requirePerm(...wantedPerms) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "no_token" });
    const roles = (req.user.roles || []).map(r => String(r).toLowerCase());
    const userPerms = req.user.perms && req.user.perms.length ? req.user.perms : getPermissions(roles);
    if (!hasAnyPerm(userPerms, wantedPerms)) return res.status(403).json({ ok: false, error: "forbidden_perm" });
    next();
  };
}

export function requireRole(...allowedRoles) {
  const allow = new Set(allowedRoles.map(s => String(s).toLowerCase()));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "no_token" });
    const roles = (req.user.roles || []).map(r => String(r).toLowerCase());
    const ok = roles.some(r => allow.has(r));
    if (!ok) {
      console.log("[RBAC] forbidden_role need:", [...allow], "have:", roles);
      return res.status(403).json({ ok: false, error: "forbidden_role" });
    }
    next();
  };
}
