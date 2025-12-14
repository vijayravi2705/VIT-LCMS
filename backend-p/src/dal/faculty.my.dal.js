// src/dal/faculty.my.dal.js
import { db } from "../db/mysql.js";

const normalizeNumber = (value, fallback, { min, max }) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (max !== undefined && n > max) return max;
  if (min !== undefined && n < min) return min;
  return n;
};

export async function listMySubmissions({
  vit_id,
  page = 1,
  limit = 20,
  q = "",
  status = "",
  severity = "",
  order = "desc",
}) {
  const pageNum = normalizeNumber(page, 1, { min: 1 });
  const pageSize = normalizeNumber(limit, 20, { min: 1, max: 100 });

  const params = [vit_id];
  const clauses = ["filed_by = 'faculty'", "created_by_vit = ?"];

  if (q) {
    clauses.push("(complaint_id LIKE ? OR title_preview LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    clauses.push("status = ?");
    params.push(status.toLowerCase());
  }
  if (severity) {
    clauses.push("severity = ?");
    params.push(severity.toLowerCase());
  }

  const where = clauses.join(" AND ");
  const sortDir = order === "asc" ? "ASC" : "DESC";

  const [rows] = await db.query(
    `
    SELECT
      complaint_id AS id,
      COALESCE(NULLIF(title, ''), title_preview) AS title,
      category      AS cat,
      severity      AS priority,
      status,
      assigned_block,
      created_on,
      updated_on,
      secret_json
    FROM complaint
    WHERE ${where}
    ORDER BY COALESCE(updated_on, created_on) ${sortDir}
    LIMIT ? OFFSET ?
    `,
    [...params, pageSize, (pageNum - 1) * pageSize]
  );

  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total FROM complaint WHERE ${where}`,
    params
  );

  return {
    rows,
    total: Number(countRow?.total || 0),
  };
}

export async function getMySubmissionById({ id, vit_id }) {
  const [[row]] = await db.query(
    `
    SELECT
      complaint_id,
      COALESCE(NULLIF(title, ''), title_preview) AS title,
      title_preview,
      description,
      secret_json,
      severity,
      category,
      subcategory,
      status,
      filed_by,
      created_by_vit,
      assigned_block,
      assigned_to,
      created_on,
      updated_on
    FROM complaint
    WHERE complaint_id = ? AND filed_by = 'faculty' AND created_by_vit = ?
    LIMIT 1
    `,
    [id, vit_id]
  );

  if (!row) return null;

  const [attachments] = await db.query(
    `
    SELECT
      file_name AS name,
      file_hash AS hash,
      uploaded_on AS ts
    FROM attachment
    WHERE complaint_id = ?
    ORDER BY uploaded_on ASC, att_id ASC
    `,
    [id]
  );

  const [parties] = await db.query(
    `
    SELECT
      cp.vit_id,
      cp.party_role,
      cp.is_primary,
      cp.notes,
      pu.full_name,
      pu.phone
    FROM complaint_party cp
    LEFT JOIN (
      SELECT vit_id, full_name, phone FROM student_profile
      UNION ALL
      SELECT vit_id, full_name, phone FROM faculty_profile
      UNION ALL
      SELECT vit_id, full_name, phone FROM warden_profile
      UNION ALL
      SELECT vit_id, full_name, phone FROM security_profile
    ) pu ON pu.vit_id = cp.vit_id
    WHERE cp.complaint_id = ?
    ORDER BY cp.cp_id ASC
    `,
    [id]
  );

  const [[fac]] = await db.query(
    `
    SELECT full_name, department, designation, phone
    FROM faculty_profile
    WHERE vit_id = ?
    LIMIT 1
    `,
    [row.created_by_vit]
  );

  return {
    row,
    attachments,
    parties,
    fac,
  };
}
