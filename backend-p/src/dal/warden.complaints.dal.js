import { db } from "../db/mysql.js";

const createdFmt = `DATE_FORMAT(c.created_on, '%Y-%m-%dT%H:%i:%s')`;
const updatedFmt = `DATE_FORMAT(c.updated_on, '%Y-%m-%dT%H:%i:%s')`;
const logFmt = `DATE_FORMAT(created_on, '%Y-%m-%dT%H:%i:%s')`;
const uploadedFmt = `DATE_FORMAT(a.uploaded_on, '%Y-%m-%dT%H:%i:%s')`;

const PROFILE_NAME =
  "COALESCE(sp.full_name, fp.full_name, wp.full_name, sec.full_name)";
const PROFILE_EMAIL =
  "COALESCE(sp.email, fp.email, wp.email, sec.email)";
const PROFILE_PHONE =
  "COALESCE(sp.phone, fp.phone, wp.phone, sec.phone)";

export async function getBlockForWarden(vit_id) {
  if (!vit_id) return null;
  const [[row]] = await db.query(
    "SELECT block_code FROM warden_profile WHERE vit_id = ? LIMIT 1",
    [vit_id]
  );
  return row?.block_code || null;
}

export async function listComplaintsForWarden({
  block_code,
  q,
  status,
  severity,
  sort = "recent",
  page = 1,
  pageSize = 10,
}) {
  if (!block_code) return { rows: [], total: 0 };

  const pageNumber = Math.max(1, Number(page) || 1);
  const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const offset = (pageNumber - 1) * limit;

  const params = [block_code];
  let base = `
    FROM complaint c
    LEFT JOIN student_profile  sp  ON sp.vit_id  = c.created_by_vit
    LEFT JOIN faculty_profile  fp  ON fp.vit_id  = c.created_by_vit
    LEFT JOIN warden_profile   wp  ON wp.vit_id  = c.created_by_vit
    LEFT JOIN security_profile sec ON sec.vit_id = c.created_by_vit
    WHERE c.assigned_block = ?
  `;

  if (status) {
    base += " AND c.status = ?";
    params.push(status);
  }
  if (severity) {
    base += " AND c.severity = ?";
    params.push(severity);
  }
  if (q) {
    base += " AND (c.title_preview LIKE ? OR c.complaint_id LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  const order =
    sort === "oldest"
      ? "c.created_on ASC"
      : sort === "priority"
      ? "FIELD(c.severity,'emergency','high','medium','low'), c.created_on DESC"
      : "c.created_on DESC";

  const [rows] = await db.query(
    `
    SELECT
      c.complaint_id,
      c.title_preview AS title,
      COALESCE(c.category,'')    AS category,
      COALESCE(c.subcategory,'') AS subcategory,
      COALESCE(c.severity,'')    AS severity,
      c.status,
      COALESCE(c.assigned_block,'') AS assigned_block,
      ${createdFmt} AS created_on,
      ${updatedFmt} AS updated_on,
      c.assigned_to,
      ${PROFILE_NAME}  AS created_by_name,
      ${PROFILE_EMAIL} AS created_by_email,
      ${PROFILE_PHONE} AS created_by_phone,
      c.created_by_vit
    ${base}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  const [[{ n }]] = await db.query(`SELECT COUNT(*) AS n ${base}`, params);
  return { rows, total: Number(n || 0) };
}

export async function getComplaintFullForWarden({ complaint_id, block_code }) {
  if (!complaint_id || !block_code) return null;

  const [[complaint]] = await db.query(
    `
    SELECT
      c.*,
      ${createdFmt} AS created_on,
      ${updatedFmt} AS updated_on,
      ${PROFILE_NAME}  AS created_by_name,
      ${PROFILE_EMAIL} AS created_by_email,
      ${PROFILE_PHONE} AS created_by_phone
    FROM complaint c
    LEFT JOIN student_profile  sp  ON sp.vit_id  = c.created_by_vit
    LEFT JOIN faculty_profile  fp  ON fp.vit_id  = c.created_by_vit
    LEFT JOIN warden_profile   wp  ON wp.vit_id  = c.created_by_vit
    LEFT JOIN security_profile sec ON sec.vit_id = c.created_by_vit
    WHERE c.complaint_id = ? AND c.assigned_block = ?
    LIMIT 1
    `,
    [complaint_id, block_code]
  );

  if (!complaint) return null;

  const [parties] = await db.query(
    `
    SELECT
      p.cp_id,
      p.complaint_id,
      p.vit_id,
      p.party_role,
      p.is_primary,
      p.notes,
      ${PROFILE_NAME}  AS full_name,
      ${PROFILE_EMAIL} AS email,
      ${PROFILE_PHONE} AS phone
    FROM complaint_party p
    LEFT JOIN student_profile  sp  ON sp.vit_id  = p.vit_id
    LEFT JOIN faculty_profile  fp  ON fp.vit_id  = p.vit_id
    LEFT JOIN warden_profile   wp  ON wp.vit_id  = p.vit_id
    LEFT JOIN security_profile sec ON sec.vit_id = p.vit_id
    WHERE p.complaint_id = ?
    ORDER BY FIELD(p.party_role,'victim','witness','accused'), p.is_primary DESC, p.cp_id ASC
    `,
    [complaint_id]
  );

  const [logs] = await db.query(
    `
    SELECT
      log_id,
      actor_vit_id,
      action,
      status_after,
      notes,
      ${logFmt} AS created_on
    FROM complaint_log
    WHERE complaint_id = ?
    ORDER BY created_on ASC, log_id ASC
    `,
    [complaint_id]
  );

  const [files] = await db.query(
    `
    SELECT
      a.att_id AS attachment_id,
      a.file_name AS name,
      a.file_path,
      a.file_hash,
      a.uploader_vit AS vit_id,
      ${uploadedFmt} AS created_on,
      ${PROFILE_NAME}  AS uploader_name,
      ${PROFILE_EMAIL} AS uploader_email,
      ${PROFILE_PHONE} AS uploader_phone
    FROM attachment a
    LEFT JOIN student_profile  sp  ON sp.vit_id  = a.uploader_vit
    LEFT JOIN faculty_profile  fp  ON fp.vit_id  = a.uploader_vit
    LEFT JOIN warden_profile   wp  ON wp.vit_id  = a.uploader_vit
    LEFT JOIN security_profile sec ON sec.vit_id = a.uploader_vit
    WHERE a.complaint_id = ?
    ORDER BY a.uploaded_on ASC, a.att_id ASC
    `,
    [complaint_id]
  );

  return { complaint, parties, logs, files };
}

export async function updateComplaintBasicForWarden(
  complaint_id,
  { status, severity, category, subcategory, assigned_to }
) {
  if (!complaint_id) return;

  const fields = [];
  const params = [];

  if (status != null) {
    fields.push("status = ?");
    params.push(status);
  }
  if (severity != null) {
    fields.push("severity = ?");
    params.push(severity);
  }
  if (category != null) {
    fields.push("category = ?");
    params.push(category);
  }
  if (subcategory != null) {
    fields.push("subcategory = ?");
    params.push(subcategory);
  }
  if (assigned_to != null) {
    fields.push("assigned_to = ?");
    params.push(assigned_to);
  }

  if (!fields.length) return;

  fields.push("updated_on = NOW()");
  await db.query(
    `UPDATE complaint SET ${fields.join(", ")} WHERE complaint_id = ?`,
    [...params, complaint_id]
  );
}
