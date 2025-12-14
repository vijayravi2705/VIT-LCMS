  import { db } from "../db/mysql.js";

export async function searchStudents(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ ok: true, items: [] });

    const like = `%${q}%`;
    const [rows] = await db.query(
      `
      SELECT
        sp.vit_id,
        sp.full_name,
        sp.email,
        sp.phone,
        sp.degree,
        sp.school,
        sp.course,
        sp.hostel_type,
        sp.block_code,
        sp.room_no,
        sp.proctor_name,
        sp.proctor_email,
        sp.proctor_phone,
        sp.proctor_office,
        sp.proctor_hours
      FROM student_profile sp
      WHERE sp.vit_id LIKE ? OR sp.full_name LIKE ? OR sp.email LIKE ? OR sp.phone LIKE ?
      ORDER BY sp.full_name ASC
      LIMIT 50
      `,
      [like, like, like, like]
    );

    const vitIds = rows.map(r => r.vit_id);
    if (vitIds.length === 0) return res.json({ ok: true, items: [] });

    const [counts] = await db.query(
      `
      SELECT x.vit_id, SUM(x.total) AS total, SUM(x.open_) AS open_, SUM(x.resolved) AS resolved
      FROM (
        SELECT c.created_by_vit AS vit_id,
               COUNT(*) AS total,
               SUM(c.status IN ('submitted','in_review','in_progress')) AS open_,
               SUM(c.status='resolved') AS resolved
        FROM complaint c
        WHERE c.created_by_vit IN (?)
        GROUP BY c.created_by_vit
        UNION ALL
        SELECT cp.vit_id AS vit_id,
               COUNT(*) AS total,
               SUM(c.status IN ('submitted','in_review','in_progress')) AS open_,
               SUM(c.status='resolved') AS resolved
        FROM complaint_party cp
        JOIN complaint c ON c.complaint_id = cp.complaint_id
        WHERE cp.vit_id IN (?) AND cp.party_role = 'accused'
        GROUP BY cp.vit_id
      ) x
      GROUP BY x.vit_id
      `,
      [vitIds, vitIds]
    );

    const map = new Map(counts.map(c => [c.vit_id, c]));
    const items = rows.map(r => ({
      vit_id: r.vit_id,
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      degree: r.degree,
      school: r.school,
      course:r.course,
      hostel_type: r.hostel_type,
      block_code: r.block_code,
      room_no: r.room_no,
        proctor: {
    name:  r.proctor_name  || null,
    email: r.proctor_email || null,
    phone: r.proctor_phone || null,
    office:r.proctor_office|| null,
    hours: r.proctor_hours || null,
  },
      stats: {
        total: Number(map.get(r.vit_id)?.total || 0),
        open: Number(map.get(r.vit_id)?.open_ || 0),
        resolved: Number(map.get(r.vit_id)?.resolved || 0),
      },
    }));

    res.json({ ok: true, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}

export async function getStudentBundle(req, res) {
  try {
    const vitId = req.params.vitId;

    const [[row]] = await db.query(
      `
      SELECT vit_id, full_name, email, phone,
             hostel_type, block_code, room_no,
             degree, school, course,
             proctor_name, proctor_email, proctor_phone, proctor_office, proctor_hours
      FROM student_profile
      WHERE vit_id = ?
      `,
      [vitId]
    );

    if (!row) return res.status(404).json({ ok: false, error: "not_found" });

    const profile = {
      vit_id: row.vit_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      degree: row.degree,
      school: row.school,
      course: row.course,
      hostel_type: row.hostel_type,
      block_code: row.block_code,
      room_no: row.room_no,
      proctor: {
        name: row.proctor_name || null,
        email: row.proctor_email || null,
        phone: row.proctor_phone || null,
        office: row.proctor_office || null,
        hours: row.proctor_hours || null,
      }
    };

    const [[statsBy]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(status IN ('submitted','in_review','in_progress')) AS open_,
              SUM(status='resolved') AS resolved
       FROM complaint
       WHERE created_by_vit = ?`,
      [vitId]
    );

    const [[statsAgainst]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(c.status IN ('submitted','in_review','in_progress')) AS open_,
              SUM(c.status='resolved') AS resolved
       FROM complaint_party cp
       JOIN complaint c ON c.complaint_id = cp.complaint_id
       WHERE cp.vit_id = ? AND cp.party_role = 'accused'`,
      [vitId]
    );

       const [complaintsBy] = await db.query(
      `SELECT
          complaint_id AS id,
          COALESCE(NULLIF(title, ''), title_preview, '(no title)') AS title,
          category,
          status,
          created_on AS updatedAt
       FROM complaint
       WHERE created_by_vit = ?
       ORDER BY created_on DESC
       LIMIT 50`,
      [vitId]
    );

    const [complaintsAgainst] = await db.query(
      `SELECT
          c.complaint_id AS id,
          COALESCE(NULLIF(c.title, ''), c.title_preview, '(no title)') AS title,
          c.category,
          c.status,
          c.created_on AS updatedAt
       FROM complaint_party cp
       JOIN complaint c ON c.complaint_id = cp.complaint_id
       WHERE cp.vit_id = ? AND cp.party_role = 'accused'
       ORDER BY c.created_on DESC
       LIMIT 50`,
      [vitId]
    );

    return res.json({
      ok: true,
      profile,
      stats: {
        by: statsBy,
        against: statsAgainst
      },
      complaintsBy,
      complaintsAgainst
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}



export async function getComplaintDetails(req, res) {
  try {
    const id = req.params.complaintId;

    const [[c]] = await db.query(
      `
      SELECT complaint_id AS id, title, category, status, severity, created_on
      FROM complaint
      WHERE complaint_id = ?
      `,
      [id]
    );
    if (!c) return res.status(404).json({ ok: false, error: "not_found" });

   const [timeline] = await db.query(
  `SELECT created_on AS t, actor_vit_id AS \`by\`, action AS what
   FROM complaint_log
   WHERE complaint_id = ?
   ORDER BY created_on ASC`,
  [id]
);

    const [[decision]] = await db.query(
      `
      SELECT decision_text AS result, decision_notes AS notes
      FROM complaint
      WHERE complaint_id = ? AND status = 'resolved'
      `,
      [id]
    );

    res.json({ ok: true, complaint: { ...c, timeline, decision: decision || null } });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
