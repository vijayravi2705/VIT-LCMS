import { db } from "../db/mysql.js";

export async function getFacultyProfileByVitId(vit_id) {
  const [[row]] = await db.query(
    `
    select vit_id,full_name,email,phone,school,department,designation from faculty_profile 

    WHERE vit_id = ?
    `,
    [vit_id]
  );
  return row || null;
}
