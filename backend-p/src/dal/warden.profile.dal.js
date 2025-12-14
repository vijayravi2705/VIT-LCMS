import { db } from "../db/mysql.js";

export async function getWardenProfileByVitId(vit_id) {
  const [[row]] = await db.query(
    `
    SELECT
      wp.vit_id,
      COALESCE(wp.full_name,  '')  AS full_name,
      COALESCE(wp.email, '')               AS email,
      COALESCE(wp.phone, '')               AS phone,
      COALESCE(wp.hostel_type, '')         AS hostel_type,
      COALESCE(wp.block_code, '')          AS block_code
    FROM warden_profile wp
    WHERE wp.vit_id = ?
    `,
    [vit_id]
  );
  return row || null;
}
