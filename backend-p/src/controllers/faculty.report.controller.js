// src/controllers/faculty.report.controller.js
import { db } from "../db/mysql.js";
import { newComplaintId } from "../utils/idgen.js";
import { sha256FileHex } from "../utils/files.js";
import { encryptJSON } from "../utils/crypto.js";
import { recordHash } from "../utils/hashchain.js";
import { sendComplaintReceipt } from "../utils/mailer.js";

const mapPriority = (p) => {
  const v = String(p || "").toLowerCase();
  return ["low", "medium", "high", "emergency"].includes(v) ? v : "low";
};

// Accept VIT student/staff formats: 22BIT0346 / 21BCE1234 / VITF100 / VITS123
const isVIT = (s) =>
  /^[A-Z]{3,4}\d{3,}$|^\d{2}[A-Z]{3}\d{3,4}$|^VIT[FS]\d{3,}$/i.test(String(s || ""));

const preview = (s, n = 160) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
};

export async function createFacultyReport(req, res) {
  const errors = [];
  let payload = {};
  try {
    payload = JSON.parse(String(req.body?.payload || "{}"));
  } catch {
    errors.push("invalid_payload");
  }

  const title = String(payload.title || "").trim();
  const detail = String(payload.detail || "").trim();
  const category = String(payload.category || "").trim().toLowerCase(); // maintenance|safety|food|other
  const subcategory = (payload.subcategory ? String(payload.subcategory).trim() : "") || null;
  const priority = mapPriority(payload.priority);
  const dt = String(payload.dt || "").trim();
  const impactScope = String(payload.impactScope || "single");
  const victims = Array.isArray(payload.victims) ? payload.victims : [];
  const witnesses = Array.isArray(payload.witnesses) ? payload.witnesses : [];
  const accused = Array.isArray(payload.accused) ? payload.accused : [];

  const ALLOWED_CATEGORIES = new Set(["maintenance", "safety", "food", "other"]);
  if (!title) errors.push("title");
  if (detail.length < 24) errors.push("detail");
  if (!category || !ALLOWED_CATEGORIES.has(category)) errors.push("category");
  if (!dt) errors.push("dt");
  if (!victims.length) errors.push("victims_min_1");
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const now = new Date();
  const complaint_id = newComplaintId();
  const filed_by = "faculty";
  const created_by_vit = req.user?.vit_id || null;
  const severity = priority;
  const title_preview = preview(title, 160);

  let assigned_block = null;
  const primaryVictim = victims[0];
  if (isVIT(primaryVictim?.reg)) {
    const [[row]] = await db.query(
      `SELECT block_code FROM student_profile WHERE vit_id=? LIMIT 1`,
      [String(primaryVictim.reg).toUpperCase()]
    );
    assigned_block = row?.block_code || null;
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // NOTE: verification_code is NOT included (DB auto-generates it via default/trigger)
    await conn.query(
      `
      INSERT INTO complaint
      (complaint_id, title_preview, title, description, secret_json, severity, category, subcategory,
       status, filed_by, created_by_vit, created_on, assigned_block)
      VALUES (?,?,?,?,?, ?,?,?, ?,?,?, NOW(), ?)
      `,
      [
        complaint_id,
        title_preview,
        title,
        detail,
        null,               // will set secret_json below
        severity,
        category,
        subcategory,
        "submitted",
        filed_by,
        created_by_vit,
        assigned_block,
      ]
    );

    // Parties
    let firstVictimDone = false;
    for (const v of victims) {
      if (isVIT(v.reg)) {
        await conn.query(
          `INSERT INTO complaint_party (complaint_id, vit_id, party_role, is_primary, notes)
           VALUES (?,?,?,?,?)`,
          [
            complaint_id,
            String(v.reg).toUpperCase(),
            "victim",
            firstVictimDone ? 0 : 1,
            v.description || null,
          ]
        );
        firstVictimDone = true;
      }
    }
    for (const w of witnesses) {
      if (isVIT(w.reg)) {
        await conn.query(
          `INSERT INTO complaint_party (complaint_id, vit_id, party_role, is_primary, notes)
           VALUES (?,?,?,?,?)`,
          [complaint_id, String(w.reg).toUpperCase(), "witness", 0, w.description || null]
        );
      }
    }
    for (const a of accused) {
      if (isVIT(a.id)) {
        await conn.query(
          `INSERT INTO complaint_party (complaint_id, vit_id, party_role, is_primary, notes)
           VALUES (?,?,?,?,?)`,
          [complaint_id, String(a.id).toUpperCase(), "accused", 0, a.description || null]
        );
      }
    }

    // Attachments
    const files = Array.isArray(req.files) ? req.files : [];
    const manifest = [];
    for (const f of files) {
      const sha256 = await sha256FileHex(f.path);
      const item = {
        storage_path: f.path.replace(process.cwd() + "/", ""),
        original_name: f.originalname,
        mime: f.mimetype,
        size: f.size,
        sha256,
        uploaded_at: now.toISOString(),
      };
      manifest.push(item);
      await conn.query(
        `INSERT INTO attachment (complaint_id, storage_path, file_hash, mime, size, original_name, uploaded_on)
         VALUES (?,?,?,?,?,?,NOW())`,
        [complaint_id, item.storage_path, sha256, f.mimetype, f.size, f.originalname]
      );
    }

    // Secret JSON
    const freeVictims = victims.filter((v) => !isVIT(v.reg));
    const freeWitnesses = witnesses.filter((w) => !isVIT(w.reg));
    const freeAccused = accused.filter((a) => !isVIT(a.id));
    const secret = {
      form: { dt, impactScope },
      people: {
        victims_freeform: freeVictims,
        witnesses_freeform: freeWitnesses,
        accused_freeform: freeAccused,
      },
      attachments: manifest,
      meta: {
        submitted_by: created_by_vit,
        filed_by,
        client_dt: dt,
        server_dt: now.toISOString(),
        form_version: 1,
      },
    };
    const secret_json = encryptJSON(secret);
    await conn.query(
      `UPDATE complaint SET secret_json=? WHERE complaint_id=?`,
      [secret_json, complaint_id]
    );

    // Hash chain log
    const [[lastLog]] = await conn.query(
      `SELECT record_hash FROM complaint_log 
       WHERE complaint_id=? 
       ORDER BY created_on DESC, log_id DESC LIMIT 1`,
      [complaint_id]
    );
    const prev_hash = lastLog?.record_hash || "0".repeat(64);
    const logPayload = {
      complaint_id,
      action: "created",
      status_after: "submitted",
      actor_vit_id: created_by_vit,
      created_on: now.toISOString(),
    };
    const rec_hash = recordHash(prev_hash, logPayload);
    await conn.query(
      `INSERT INTO complaint_log 
         (complaint_id, actor_vit_id, action, status_after, notes, created_on, prev_hash, record_hash)
       VALUES (?,?,?,?,NOW(),?,?)`,
      [complaint_id, created_by_vit, "created", "submitted", "Incident filed", prev_hash, rec_hash]
    );

    await conn.commit();

    // Email best-effort (non-fatal). We don't know the verification code here (DB-generated).
    try {
      sendComplaintReceipt(
        req.user?._raw?.email || null,
        complaint_id,
        null, // unknown here; DB generated
        req.user?._raw?.name || "Faculty"
      );
    } catch {}

    return res.status(201).json({
      ok: true,
      complaint_id,
      status: "submitted",
      assigned_block,
      attachments_saved: files.length,
    });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    return res.status(500).json({ ok: false, error: String(e) });
  } finally {
    if (conn) conn.release();
  }
}
