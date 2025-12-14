// src/dal/userProfile.dal.js
import { db } from "../db/mysql.js";

/**
 * Get primary email + full_name for a given vit_id depending on role.
 * role can be one of: 'student' | 'faculty' | 'warden' | 'security'
 */
export async function getEmailByRoleAndVitId(role, vit_id) {
  let table = null;
  switch (role) {
    case "student": table = "student_profile"; break;
    case "faculty": table = "faculty_profile"; break;
    case "warden": table = "warden_profile"; break;
    case "security": table = "security_profile"; break;
    default: return null;
  }

  const [rows] = await db.execute(
    `SELECT email, full_name FROM ${table} WHERE vit_id = ? LIMIT 1`,
    [vit_id]
  );
  return rows?.[0] || null;
}
