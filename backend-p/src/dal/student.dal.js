// src/dal/student.dal.js
import { db } from "../db/mysql.js";

// --- helpers
const normStatus = (s) => {
  if (!s) return "Submitted";
  if (s === "submitted") return "Submitted";
  if (s === "in_review") return "In Review";
  if (s === "in_progress") return "In Progress";
  if (s === "resolved") return "Resolved";
  if (s === "rejected") return "Rejected";
  return s;
};

// -----------------------------------------------------------
// Search students by q across vit_id, name, email, phone
// -----------------------------------------------------------
export async function searchStudentsDAL(q, limit = 10) {
  const like = `%${q}%`;
  const [rows] = await db.query(
    `
    SELECT
      s.vit_id        AS reg,
      s.full_name     AS name,
      s.department    AS dept,
      s.year          AS year,
      s.section       AS section,
      s.avatar_url    AS avatar
    FROM student_profile s
    WHERE
      s.vit_id   LIKE ? OR
      s.full_name LIKE ? OR
      s.email    LIKE ? OR
      s.phone    LIKE ?
    ORDER BY s.full_name ASC
    LIMIT ?
    `,
    [like, like, like, like, Number(limit)]
  );

  // attach counts (by complaints filed BY this student)
  const vitIds = rows.map(r => r.reg);
  let countsMap = new Map();
  if (vitIds.length) {
    const [counts] = await db.query(
      `
      SELECT
        c.created_by_vit AS vit_id,
        COUNT(*) AS total,
        SUM(c.status IN ('submitted','in_review','in_progress')) AS open_cnt,
        SUM(c.status = 'resolved') AS resolved_cnt
      FROM complaint c
      WHERE c.created_by_vit IN (?)
      GROUP BY c.created_by_vit
      `,
      [vitIds]
    );
    countsMap = new Map(counts.map(c => [c.vit_id, c]));
  }

  return rows.map(r => {
    const c = countsMap.get(r.reg) || {};
    return {
      reg: r.reg,
      name: r.name,
      dept: r.dept,
      year: r.year,
      section: r.section,
      avatar: r.avatar,
      stats: {
        total: Number(c.total || 0),
        open: Number(c.open_cnt || 0),
        resolved: Number(c.resolved_cnt || 0),
      },
    };
  });
}

// -----------------------------------------------------------
// Core profile by VIT ID (single source of truth)
// -----------------------------------------------------------
export async function getStudentProfileByVitId(vitId) {
  const [rows] = await db.query(
    `
    SELECT
      vit_id, full_name, email, phone,
      hostel_type, block_code, room_type, room_no,
      degree, school, course, dob, blood_group, address, guardian,
      mess_type, mess_caterer,
      department AS dept, year, section, avatar_url AS avatar
    FROM student_profile
    WHERE vit_id = ?
    LIMIT 1
    `,
    [vitId]
  );
  return rows[0] || null;
}

// -----------------------------------------------------------
// Summary counts for a student (complaints they filed)
// -----------------------------------------------------------
export async function getStudentSummary(vitId) {
  const [[t]] = await db.query(
    `SELECT COUNT(*) AS total FROM complaint WHERE created_by_vit = ?`,
    [vitId]
  );
  const [[r]] = await db.query(
    `SELECT COUNT(*) AS resolved FROM complaint WHERE created_by_vit = ? AND status='resolved'`,
    [vitId]
  );
  const [[p]] = await db.query(
    `SELECT COUNT(*) AS pending FROM complaint WHERE created_by_vit = ? AND status IN ('submitted','in_review','in_progress')`,
    [vitId]
  );
  const [[x]] = await db.query(
    `SELECT COUNT(*) AS rejected FROM complaint WHERE created_by_vit = ? AND status='rejected'`,
    [vitId]
  );
  const [recent] = await db.query(
    `
    SELECT complaint_id, title, category, subcategory, severity, status, created_on
    FROM complaint
    WHERE created_by_vit = ?
    ORDER BY created_on DESC
    LIMIT 10
    `,
    [vitId]
  );

  return {
    total: Number(t?.total || 0),
    resolved: Number(r?.resolved || 0),
    pending: Number(p?.pending || 0),
    rejected: Number(x?.rejected || 0),
    recent
  };
}

// -----------------------------------------------------------
// Complaints filed BY this student (reporter)
// -----------------------------------------------------------
export async function getComplaintsByStudent(vitId) {
  const [rows] = await db.query(
    `
    SELECT
      c.complaint_id AS id,
      c.title,
      c.category,
      c.status,
      c.severity,
      c.assigned_block,
      c.created_on,
      c.updated_at
    FROM complaint c
    WHERE c.created_by_vit = ?
    ORDER BY COALESCE(c.updated_at, c.created_on) DESC
    `,
    [vitId]
  );
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: normStatus(r.status),
    updatedAt: r.updated_at || r.created_on,
    severity: r.severity,
    block: r.assigned_block,
    reportedAt: r.created_on
  }));
}

// -----------------------------------------------------------
// Complaints AGAINST this student (victim/accused)
// -----------------------------------------------------------
export async function getComplaintsAgainstStudent(vitId) {
  const [rows] = await db.query(
    `
    SELECT
      c.complaint_id AS id,
      c.title,
      c.category,
      c.status,
      c.severity,
      c.assigned_block,
      c.created_on,
      c.updated_at
    FROM complaint_party cp
    JOIN complaint c ON c.complaint_id = cp.complaint_id
    WHERE cp.vit_id = ? AND cp.role IN ('victim','accused')
    ORDER BY COALESCE(c.updated_at, c.created_on) DESC
    `,
    [vitId]
  );
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: normStatus(r.status),
    updatedAt: r.updated_at || r.created_on,
    severity: r.severity,
    block: r.assigned_block,
    reportedAt: r.created_on
  }));
}

// -----------------------------------------------------------
// Timeline + decision for a complaint (for drawer)
// -----------------------------------------------------------
export async function getComplaintTimeline(complaintId) {
  const [rows] = await db.query(
    `
    SELECT
      created_on AS t,
      actor_role AS \`by\`,
      action     AS what
    FROM complaint_log
    WHERE complaint_id = ?
    ORDER BY created_on ASC
    `,
    [complaintId]
  );
  return rows.map(r => ({ t: r.t, by: r.by, what: r.what }));
}

export async function getComplaintDecision(complaintId) {
  const [[row]] = await db.query(
    `SELECT decision_text AS result, decision_notes AS notes FROM complaint WHERE complaint_id = ?`,
    [complaintId]
  );
  if (!row || !row.result) return null;
  return { result: row.result, notes: row.notes || "" };
}
