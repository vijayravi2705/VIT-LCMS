// src/dal/complaint.dal.js
import { db } from "../db/mysql.js";
import { recordHash } from "../utils/hashchain.js";

export async function createComplaintTx({ complaint, parties, firstLog }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `
      INSERT INTO complaint (
        complaint_id, title, title_preview, description, secret_json,
        severity, category, subcategory, status,
        filed_by, created_by_vit, created_on, assigned_block, verification_code
      )
      VALUES (?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?)
      `,
      [
        complaint.complaint_id,
        complaint.title,
        complaint.title_preview,
        complaint.description || "",
        complaint.secret_json,
        complaint.severity || null,
        complaint.category || null,
        complaint.subcategory || null,
        complaint.status,
        complaint.filed_by,
        complaint.created_by_vit,
        complaint.created_on,
        complaint.assigned_block || null,
        complaint.verification_code
      ]
    );

    if (Array.isArray(parties) && parties.length) {
      for (const p of parties) {
        await conn.query(
          `
          INSERT INTO complaint_party
            (complaint_id, vit_id, party_role, is_primary, notes)
          VALUES (?,?,?,?,?)
          `,
          [
            complaint.complaint_id,
            String(p.vit_id || "").toUpperCase(),
            p.party_role,
            p.is_primary ? 1 : 0,
            p.notes || null
          ]
        );
      }
    }

    // first log (NO log_id column here; it auto-increments)
    const prevHash = "0".repeat(64);
    const recHash = recordHash(prevHash, firstLog);

    await conn.query(
      `
      INSERT INTO complaint_log
        (complaint_id, actor_vit_id, action, status_after,
         notes, created_on, prev_hash, record_hash)
      VALUES (?,?,?,?,?, NOW(), ?,?)
      `,
      [
        complaint.complaint_id,
        firstLog.actor_vit_id,
        firstLog.action,
        firstLog.status_after,
        firstLog.notes || null,
        prevHash,
        recHash
      ]
    );

    await conn.commit();
    return true;
  } catch (e) {
    try { await conn.rollback(); } catch {}
    throw e;
  } finally {
    conn.release();
  }
}

export async function listComplaintsBasic({ limit = 50, severity, status, order = "desc" } = {}) {
  const params = [];
  let sql = `
    SELECT
      complaint_id,
      title_preview AS title,
      COALESCE(severity,'') AS severity,
      COALESCE(category,'') AS category,
      status,
      COALESCE(assigned_block,'') AS assigned_block,
      DATE_FORMAT(created_on, '%Y-%m-%dT%H:%i:%s') AS created_on
    FROM complaint
    WHERE 1=1
  `;
  if (severity) { sql += " AND severity = ?"; params.push(severity); }
  if (status)   { sql += " AND status = ?";   params.push(status); }
  sql += ` ORDER BY created_on ${order === "asc" ? "ASC" : "DESC"} LIMIT ?`;
  params.push(+limit);

  const [rows] = await db.query(sql, params);
  return rows;
}

export async function getComplaintFull(cid) {
  const [[row]] = await db.query(
    `
    SELECT *,
           DATE_FORMAT(created_on, '%Y-%m-%dT%H:%i:%s') AS created_on
    FROM complaint
    WHERE complaint_id = ?
    `,
    [cid]
  );
  if (!row) return null;

  const [parties] = await db.query(
    `SELECT * FROM complaint_party WHERE complaint_id = ?`,
    [cid]
  );

  const [logs] = await db.query(
    `
    SELECT *, DATE_FORMAT(created_on, '%Y-%m-%dT%H:%i:%s') AS created_on
    FROM complaint_log
    WHERE complaint_id = ?
    ORDER BY created_on ASC, log_id ASC
    `,
    [cid]
  );

  const [files] = await db.query(
    `SELECT * FROM attachment WHERE complaint_id = ?`,
    [cid]
  );

  return { complaint: row, parties, logs, files };
}

export async function appendLog({ log, prevHash }) {
  // NO log_id in column list
  const recHash = recordHash(prevHash, log);
  await db.query(
    `
    INSERT INTO complaint_log
      (complaint_id, actor_vit_id, action, status_after,
       notes, created_on, prev_hash, record_hash)
    VALUES (?,?,?,?,?, NOW(), ?,?)
    `,
    [
      log.complaint_id,
      log.actor_vit_id,
      log.action,
      log.status_after,
      log.notes || null,
      prevHash,
      recHash
    ]
  );
  return recHash;
}

export async function lastLogHash(cid) {
  const [[l]] = await db.query(
    `
    SELECT record_hash
    FROM complaint_log
    WHERE complaint_id = ?
    ORDER BY created_on DESC, log_id DESC
    LIMIT 1
    `,
    [cid]
  );
  return l?.record_hash || "0".repeat(64);
}

export async function updateComplaintStatus(cid, status) {
  await db.query(`UPDATE complaint SET status = ? WHERE complaint_id = ?`, [status, cid]);
}

export async function listComplaintsByUser({ vit_id, limit = 50, status, severity, q, order = "desc" }) {
  const params = [vit_id];
  let sql = `
    SELECT
      complaint_id,
      title_preview AS title,
      COALESCE(category,'')    AS category,
      COALESCE(subcategory,'') AS subcategory,
      COALESCE(severity,'')    AS severity,
      status,
      COALESCE(assigned_block,'') AS assigned_block,
      DATE_FORMAT(created_on, '%Y-%m-%dT%H:%i:%s') AS created_on
    FROM complaint
    WHERE created_by_vit = ?
  `;
  if (status)   { sql += " AND status = ?";   params.push(status); }
  if (severity) { sql += " AND severity = ?"; params.push(severity); }
  if (q)        { sql += " AND title_preview LIKE ?"; params.push(`%${q}%`); }
  sql += ` ORDER BY created_on ${order === "asc" ? "ASC" : "DESC"} LIMIT ?`;
  params.push(+limit);

  const [rows] = await db.query(sql, params);
  return rows;
}
