// src/controllers/student.controller.js
import { db } from "../db/mysql.js";

export async function getStudentProfile(req, res) {
  try {
    const vit = String(req.user?.vit_id || "").toUpperCase();
    if (!vit) return res.status(401).json({ ok: false, error: "no_token_vit" });

    const [[row]] = await db.query(
      `
      SELECT
        vit_id,
        full_name,
        email,
        phone,
        hostel_type,
        block_code,
        room_no,
        room_type,
        dob,
        blood_group,
        mess_type,
        mess_caterer,
        guardian,
        address,
        degree,
        school
      FROM student_profile
      WHERE vit_id = ?
      LIMIT 1
      `,
      [vit]
    );

    return res.json({ ok: true, profile: row || null });
  } catch (err) {
    console.error("getStudentProfile failed:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}

export async function getStudentSummary(req, res) {
  try {
    const vit = String(req.user?.vit_id || "").toUpperCase();
    if (!vit) return res.status(401).json({ ok: false, error: "no_token_vit" });

    const [[counts]] = await db.query(
      `SELECT
         SUM(status='resolved') AS resolved,
         SUM(status IN ('submitted','in_review','in_progress')) AS pending,
         SUM(status='rejected') AS rejected,
         COUNT(*) AS total
       FROM complaint
       WHERE created_by_vit = ?`,
      [vit]
    );

    return res.json({
      ok: true,
      summary: counts || { resolved: 0, pending: 0, rejected: 0, total: 0 }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
