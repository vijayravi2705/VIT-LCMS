// backend-p/src/services/emailLookup.service.js
import { db } from "../db/mysql.js";

export async function getEmailForFiledBy(filedBy, vitId) {
  const role = String(filedBy || "").toLowerCase();
  const id = String(vitId || "");
  if (!id) return null;

  if (role === "student") {
    const [[row]] = await db.query(
      "SELECT email AS to_email, full_name AS display_name FROM student_profile WHERE vit_id = ? LIMIT 1",
      [id]
    );
    return row || null;
  }

  if (role === "faculty") {
    const [[row]] = await db.query(
      "SELECT email AS to_email, full_name AS display_name FROM faculty_profile WHERE vit_id = ? LIMIT 1",
      [id]
    );
    return row || null;
  }

  if (role === "warden") {
    const [[row]] = await db.query(
      "SELECT email AS to_email, full_name AS display_name FROM warden_profile WHERE vit_id = ? LIMIT 1",
      [id]
    );
    return row || null;
  }

  if (role === "security") {
    const [[row]] = await db.query(
      "SELECT email AS to_email, full_name AS display_name FROM security_profile WHERE vit_id = ? LIMIT 1",
      [id]
    );
    return row || null;
  }

  return null;
}

export async function getFacultyRecipients() {
  const [rows] = await db.query(
    "SELECT email AS to_email, full_name AS display_name FROM faculty_profile WHERE COALESCE(email,'') <> ''"
  );
  return rows || [];
}

export async function getFacultyRecipientsByBlock(blockCode) {
  if (!blockCode) return getFacultyRecipients();
  const [rows] = await db.query(
    `SELECT fp.email AS to_email, fp.full_name AS display_name
     FROM faculty_profile fp
     JOIN block_assignment ba ON ba.vit_id = fp.vit_id
     WHERE COALESCE(fp.email,'') <> '' AND ba.block_code = ?`,
    [blockCode]
  );
  return rows || [];
}
