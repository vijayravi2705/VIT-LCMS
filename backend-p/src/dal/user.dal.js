// src/dal/user.dal.js
import { db } from "../db/mysql.js";

/**
 * Fetch one user by vtop_username with a CSV of role_ids.
 * Uses positional `?` placeholders (MySQL2 does NOT support :named by default).
 */
export async function getUserWithRolesByUsername(username) {
  const sql = `
    SELECT 
      u.user_id,
      u.vtop_username,
      u.vit_id,
      u.password_hash,
      u.is_active,
      COALESCE(GROUP_CONCAT(ur.role_id ORDER BY ur.role_id SEPARATOR ','), '') AS roles
    FROM user_account u
    LEFT JOIN user_role ur ON ur.user_id = u.user_id
    WHERE u.vtop_username = ?
    GROUP BY u.user_id
    LIMIT 1
  `;
  const [rows] = await db.execute(sql, [username]);
  return rows[0] || null;
}
