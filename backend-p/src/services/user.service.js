// backend/src/services/user.service.js
import bcrypt from "bcryptjs";
import db from "../db/mysql.js"; // your mysql2/promise pool/connection

export async function findUserByUsername(username) {
  const [rows] = await db.execute(
    "SELECT user_id, vit_id, vtop_username, password_hash, is_active FROM user_account WHERE vtop_username = ?",
    [username]
  );
  return rows[0] || null;
}

export async function getUserRoles(user_id) {
  const [rows] = await db.execute(
    `SELECT r.role_name
     FROM user_role ur
     JOIN role r ON r.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [user_id]
  );
  return rows.map(r => r.role_name);
}

export async function checkPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}
