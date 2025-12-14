// src/services/rbac.service.js

export const ROLE_ID = {
  student: "1",
  faculty: "2",
  warden:  "3",
  security:"4",
  admin:   "99",
};

// Reverse map: "1" -> "student"
export const ROLE_NAME = Object.fromEntries(
  Object.entries(ROLE_ID).map(([name, id]) => [String(id), name])
);

// ---- Role → Permissions (by role slug) ----
const ROLE_PERMS_BY_NAME = {
  student: [
    "complaint:create:self",
    "complaint:read:self",
  ],

  // faculty has normal faculty perms + full admin powers
  faculty: [
    "complaint:create",
    "complaint:read:block",
    "complaint:update:block",
    "complaint:escalate",
    // admin powers
    "admin:*",
    "complaint:read:all",
  ],

  warden: [
    "complaint:read:block",
    "complaint:update:block",
    "complaint:resolve",
  ],

  // security can ONLY file complaints
  security: [
    "complaint:create",
  ],

  admin: [
    "admin:*",
    "complaint:read:all",
  ],
};

// Normalize a single role value to a slug ("student","faculty",…)
// Accepts either a slug or a numeric id string like "1"
export function normalizeRoleName(roleValue) {
  const v = String(roleValue).trim().toLowerCase();
  if (ROLE_PERMS_BY_NAME[v]) return v;   // already a slug
  const maybe = ROLE_NAME[v];            // numeric -> slug
  return maybe || v;
}

// Convert an array of role IDs/slugs into clean slugs
export function mapRoleIdsToSlugs(roleValues = []) {
  return roleValues.map(normalizeRoleName).filter(Boolean);
}

// Compute flattened permission set from role values (ids or slugs)
export function getPermissions(roleValues = []) {
  const out = new Set();
  mapRoleIdsToSlugs(roleValues).forEach((name) => {
    (ROLE_PERMS_BY_NAME[name] || []).forEach((p) => out.add(p));
  });
  return [...out];
}

// Check if userPerms contains at least one of wanted perms,
// honoring wildcard grants like "admin:*" or "complaint:*"
export function hasAnyPerm(userPerms = [], wanted = []) {
  const up = new Set(userPerms);
  const wild = [...up].filter((p) => p.endsWith(":*"));
  return wanted.some((need) => {
    if (up.has(need)) return true;
    for (const w of wild) {
      const base = w.slice(0, -2);
      if (need === base || need.startsWith(base + ":")) return true;
    }
    return false;
  });
}
