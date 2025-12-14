// src/dal/faculty.complaints.dal.js
import { db } from "../db/mysql.js";
import { recordHash } from "../utils/hashchain.js";

const PEOPLE_UNION = `
  SELECT vit_id, full_name, email, phone, 'student' AS role FROM student_profile
  UNION ALL
  SELECT vit_id, full_name, email, phone, 'faculty' AS role FROM faculty_profile
  UNION ALL
  SELECT vit_id, full_name, email, phone, 'warden' AS role FROM warden_profile
  UNION ALL
  SELECT vit_id, full_name, email, phone, 'security' AS role FROM security_profile
`;

export async function listComplaints({ q, status, priority, sort, page, pageSize }) {
  const where = [];
  const params = [];
  if (q) {
    where.push("(c.complaint_id LIKE ? OR c.title LIKE ? OR c.title_preview LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push("c.status = ?");
    params.push(status);
  }
  if (priority) {
    where.push("c.severity = ?");
    params.push(priority);
  }
  const order =
    sort === "oldest"
      ? "c.created_on ASC"
      : sort === "priority"
      ? "FIELD(c.severity,'emergency','high','medium','low'), c.updated_on DESC, c.created_on DESC"
      : "c.updated_on DESC, c.created_on DESC";
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const [rows] = await db.query(
    `
    SELECT
      c.complaint_id AS cmpid,
      c.title_preview AS title,
      c.description,
      c.severity,
      c.category,
      c.subcategory,
      c.status,
      c.assigned_block,
      c.assigned_to,
      c.created_on,
      c.updated_on,
      c.is_locked,
      c.lock_owner_vit,
      c.locked_on
    FROM complaint c
    ${whereSql}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset]
  );

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM complaint c ${whereSql}`, params);
  return { rows, total };
}

export async function getComplaintById(id) {
  const [rows] = await db.query(
    `
    SELECT
      c.complaint_id AS cmpid,
      c.title_preview,
      c.title,
      c.description,
      c.secret_json,
      c.severity,
      c.category,
      c.subcategory,
      c.status,
      c.filed_by,
      c.created_by_vit,
      c.created_on,
      c.updated_on,
      c.assigned_block,
      c.assigned_to,
      c.verification_code,
      c.is_locked,
      c.lock_owner_vit,
      c.locked_on,
      c.lock_reason,
      d.full_name  AS created_by_name,
      d.phone      AS created_by_phone,
      d.email      AS created_by_email
    FROM complaint c
    LEFT JOIN (
      ${PEOPLE_UNION}
    ) d ON d.vit_id = c.created_by_vit
    WHERE c.complaint_id = ?
    `,
    [id]
  );
  return rows[0] || null;
}

export async function getPartiesByComplaint(id) {
  const [rows] = await db.query(
    `
    SELECT
      p.cp_id,
      p.complaint_id,
      p.vit_id,
      p.party_role,
      p.is_primary,
      p.notes,
      d.full_name AS full_name,
      d.email     AS email,
      d.phone     AS phone
    FROM complaint_party p
    LEFT JOIN (${PEOPLE_UNION}) d ON d.vit_id = p.vit_id
    WHERE p.complaint_id = ?
    ORDER BY FIELD(p.party_role,'victim','witness','accused'), p.is_primary DESC, p.cp_id ASC
    `,
    [id]
  );
  return rows;
}

export async function getAttachmentsByComplaint(id) {
  const [rows] = await db.query(
    `
    SELECT
      a.att_id AS attachment_id,
      a.complaint_id,
      a.uploader_vit AS vit_id,
      a.file_name AS name,
      a.file_path,
      a.file_hash,
      a.uploaded_on AS created_on,
      d.full_name AS uploader_name,
      d.phone AS uploader_phone,
      d.email AS uploader_email
    FROM attachment a
    LEFT JOIN (${PEOPLE_UNION}) d ON d.vit_id = a.uploader_vit
    WHERE a.complaint_id = ?
    ORDER BY a.uploaded_on ASC, a.att_id ASC
    `,
    [id]
  );
  return rows;
}

async function lastLogHash(complaintId) {
  const [r] = await db.query(
    `
    SELECT record_hash
    FROM complaint_log
    WHERE complaint_id = ?
    ORDER BY created_on DESC, log_id DESC
    LIMIT 1
    `,
    [complaintId]
  );
  return r.length ? r[0].record_hash || "" : "";
}

export async function updateComplaintFields(id, fields, actorVitId) {
  const [[row]] = await db.query(`SELECT is_locked FROM complaint WHERE complaint_id = ?`, [id]);
  const locked = !!row?.is_locked;

  const toSet = [];
  const params = [];
  if (fields.status) {
    toSet.push("status = ?");
    params.push(fields.status);
  }
  if (fields.severity) {
    toSet.push("severity = ?");
    params.push(fields.severity);
  }
  if (fields.category) {
    toSet.push("category = ?");
    params.push(fields.category);
  }
  if (fields.subcategory !== undefined) {
    toSet.push("subcategory = ?");
    params.push(fields.subcategory || null);
  }
  if (fields.assigned_to !== undefined) {
    toSet.push("assigned_to = ?");
    params.push(fields.assigned_to || null);
  }
  if (fields.assigned_block !== undefined) {
    toSet.push("assigned_block = ?");
    params.push(fields.assigned_block || null);
  }

  if (toSet.length) {
    toSet.push("updated_on = NOW()");
    await db.query(`UPDATE complaint SET ${toSet.join(", ")} WHERE complaint_id = ?`, [...params, id]);
  }

  const prev = await lastLogHash(id);
  const rec = recordHash(prev, {
    complaint_id: id,
    actor_vit_id: actorVitId || null,
    action: "update",
    status_after: fields.status || null,
    notes: fields.admin_notes || "",
    created_on: new Date().toISOString(),
  });

  await db.query(
    `
    INSERT INTO complaint_log
      (complaint_id, actor_vit_id, action, status_after, notes, created_on, prev_hash, record_hash)
    VALUES
      (?, ?, 'update', ?, ?, NOW(), ?, ?)
    `,
    [id, actorVitId || null, fields.status || null, fields.admin_notes || "", prev, rec]
  );

  return { ok: true, locked, statusAfter: fields.status || null };
}

async function writeAssignment(complaintId, update, note, actorVitId, statusAfter = "in_review") {
  if (!complaintId) return false;

  const sets = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(update, "assignedBlock")) {
    sets.push("assigned_block = ?");
    params.push(update.assignedBlock);
  }
  if (Object.prototype.hasOwnProperty.call(update, "assignedTo")) {
    sets.push("assigned_to = ?");
    params.push(update.assignedTo);
  }

  sets.push("status = ?");
  params.push(statusAfter);
  sets.push("updated_on = NOW()");

  const [result] = await db.query(
    `UPDATE complaint SET ${sets.join(", ")} WHERE complaint_id = ?`,
    [...params, complaintId]
  );
  if (!result.affectedRows) return false;

  const prev = await lastLogHash(complaintId);
  const rec = recordHash(prev, {
    complaint_id: complaintId,
    actor_vit_id: actorVitId || null,
    action: "assigned",
    status_after: statusAfter,
    notes: note || "",
    created_on: new Date().toISOString(),
  });

  await db.query(
    `
    INSERT INTO complaint_log
      (complaint_id, actor_vit_id, action, status_after, notes, created_on, prev_hash, record_hash)
    VALUES (?, ?, 'assigned', ?, ?, NOW(), ?, ?)
    `,
    [complaintId, actorVitId || null, statusAfter, note || "", prev, rec]
  );

  return true;
}

export async function assignComplaintToFaculty(complaintId, facultyVitId, note, actorVitId) {
  const target = String(facultyVitId || "").trim();
  if (!target) return false;

  const [[faculty]] = await db.query(
    "SELECT vit_id FROM faculty_profile WHERE vit_id = ? LIMIT 1",
    [target]
  );
  if (!faculty) return false;

  return writeAssignment(
    complaintId,
    { assignedTo: target },
    note,
    actorVitId
  );
}

export async function assignComplaintToWardenByVit(complaintId, wardenVitId, note, actorVitId) {
  const target = String(wardenVitId || "").trim();
  if (!target) return false;

  const [[warden]] = await db.query(
    "SELECT vit_id, block_code FROM warden_profile WHERE vit_id = ? LIMIT 1",
    [target]
  );
  if (!warden?.vit_id || !warden.block_code) return false;

  return writeAssignment(
    complaintId,
    { assignedTo: warden.vit_id, assignedBlock: warden.block_code },
    note,
    actorVitId
  );
}

export async function assignComplaintToWardenByBlock(complaintId, rawBlockCode, note, actorVitId) {
  const blockCode = String(rawBlockCode || "").trim().toUpperCase();
  if (!blockCode) return false;

  const [[warden]] = await db.query(
    "SELECT vit_id FROM warden_profile WHERE UPPER(block_code) = ? LIMIT 1",
    [blockCode]
  );
  if (!warden?.vit_id) return false;

  return writeAssignment(
    complaintId,
    { assignedTo: warden.vit_id, assignedBlock: blockCode },
    note,
    actorVitId
  );
}

export async function getLogs(id) {
  const [rows] = await db.query(
    `
    SELECT log_id, complaint_id, actor_vit_id, action, status_after, notes, created_on, prev_hash, record_hash
    FROM complaint_log
    WHERE complaint_id = ?
    ORDER BY created_on DESC, log_id DESC
    `,
    [id]
  );
  return rows;
}

export async function getComplaintMeta(id) {
  const [rows] = await db.query(
    `
    SELECT complaint_id, title_preview, title, created_by_vit
    FROM complaint
    WHERE complaint_id = ?
    `,
    [id]
  );
  return rows[0] || null;
}

export async function getComplaintSecretRow(id) {
  const [rows] = await db.query(
    `SELECT complaint_id, secret_json FROM complaint WHERE complaint_id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getContactForVit(vitId) {
  if (!vitId) return null;
  const [rows] = await db.query(
    `
    SELECT vit_id, full_name, email, phone FROM student_profile WHERE vit_id = ?
    UNION ALL
    SELECT vit_id, full_name, email, phone FROM faculty_profile WHERE vit_id = ?
    UNION ALL
    SELECT vit_id, full_name, email, phone FROM warden_profile WHERE vit_id = ?
    UNION ALL
    SELECT vit_id, full_name, email, phone FROM security_profile WHERE vit_id = ?
    LIMIT 1
    `,
    [vitId, vitId, vitId, vitId]
  );
  return rows[0] || null;
}

export async function lockComplaint(id, lockerVit, reason = "") {
  await db.query(
    `UPDATE complaint SET is_locked = 1, lock_owner_vit = ?, locked_on = NOW(), lock_reason = ? WHERE complaint_id = ?`,
    [lockerVit, reason || null, id]
  );
  const prev = await lastLogHash(id);
  const rec = recordHash(prev, {
    complaint_id: id,
    actor_vit_id: lockerVit,
    action: "locked",
    status_after: null,
    notes: reason || "",
    created_on: new Date().toISOString(),
  });
  await db.query(
    `INSERT INTO complaint_log (complaint_id, actor_vit_id, action, status_after, notes, created_on, prev_hash, record_hash) VALUES (?, ?, 'locked', NULL, ?, NOW(), ?, ?)`,
    [id, lockerVit, reason || "", prev, rec]
  );
  return true;
}

export async function unlockComplaint(id, actorVit, reason = "") {
  await db.query(
    `UPDATE complaint SET is_locked = 0, lock_owner_vit = NULL, locked_on = NULL, lock_reason = NULL WHERE complaint_id = ?`,
    [id]
  );
  const prev = await lastLogHash(id);
  const rec = recordHash(prev, {
    complaint_id: id,
    actor_vit_id: actorVit,
    action: "unlocked",
    status_after: null,
    notes: reason || "",
    created_on: new Date().toISOString(),
  });
  await db.query(
    `INSERT INTO complaint_log (complaint_id, actor_vit_id, action, status_after, notes, created_on, prev_hash, record_hash) VALUES (?, ?, 'unlocked', NULL, ?, NOW(), ?, ?)`,
    [id, actorVit, reason || "", prev, rec]
  );
  return true;
}
