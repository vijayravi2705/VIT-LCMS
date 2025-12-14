import jwt from "jsonwebtoken";
import { getUserWithRolesByUsername } from "../dal/user.dal.js";
import { verifyPassword } from "../services/hash.service.js";
import { getPermissions, mapRoleIdsToSlugs } from "../services/rbac.service.js";
import { env } from "../config/env.js";

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    console.log("[login] incoming:", username);

    const u = await getUserWithRolesByUsername(username);
    if (!u) return res.status(401).json({ ok: false, error: "invalid credentials" });
    if (!u.is_active) return res.status(401).json({ ok: false, error: "invalid credentials" });

    console.log("[login] ✅ user found:", {
      user_id: u.user_id,
      vit_id: u.vit_id,
      name: u.vtop_username,
      roles_raw: u.roles,
      hash_len: (u.password_hash || "").length
    });

    console.log(
      "[login] len/plain/hex:",
      (password || "").length,
      JSON.stringify(password || ""),
      [...Buffer.from(String(password || ""))].map(b => b.toString(16)).join(" ")
    );

    console.log("[login] 🔐 verifying password...");
    const ok = await verifyPassword(u.password_hash, password);
    if (!ok) return res.status(401).json({ ok: false, error: "invalid credentials" });
    console.log("[login] ✅ password OK");

    const roleIds = (u.roles || "").split(",").filter(Boolean);
    const roles = mapRoleIdsToSlugs(roleIds);
    const perms = getPermissions(roles);

    if (!env.JWT_ACCESS_SECRET) {
      return res.status(500).json({ ok: false, error: "jwt_secret_missing" });
    }

    const token = jwt.sign(
      { sub: u.user_id, vit_id: u.vit_id, roles, perms },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_TTL || "20m" }
    );

    console.log("[login] 🎫 JWT issued:", u.user_id);

    return res.json({
      ok: true,
      token,
      me: { user_id: u.user_id, vit_id: u.vit_id, username: u.vtop_username, roles },
    });
  } catch (err) {
    console.error("[login] 💥 Exception:", err);
    next(err);
  }
}
