import { db } from "../db/mysql.js";

export async function getSecurityProfileByVitId(vit_id) {
  const [[row]] = await db.query(
    `
    SELECT
      sp.vit_id,
      COALESCE(sp.full_name, sp.name, '')  AS full_name,
      COALESCE(sp.email, '')               AS email,
      COALESCE(sp.phone, '')               AS phone,
      COALESCE(sp.hostel_type, '')         AS hostel_type,
      COALESCE(sp.post_location, '')       AS post_location
    FROM security_profile sp
    WHERE sp.vit_id = ?
    `,
    [vit_id]
  );
  return row || null;
}
