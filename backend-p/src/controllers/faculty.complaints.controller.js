// src/controllers/faculty.complaints.controller.js
import * as dal from "../dal/faculty.complaints.dal.js";
import { decryptJSON } from "../utils/crypto.js";
import { sendComplaintStatusUpdate } from "../utils/mailer.js";

const isAdmin = (req) => Array.isArray(req.user?.roles) && req.user.roles.includes("faculty_admin");

export async function listFacultyComplaints(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "10", 10)));
    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim();
    const priority = (req.query.priority || "").trim();
    const sort = (req.query.sort || "recent").trim();
    const { rows, total } = await dal.listComplaints({ q, status, priority, sort, page, pageSize });
    return res.json({ ok: true, data: rows, page, pageSize, total });
  } catch (e) {
    next(e);
  }
}

export async function getOneFacultyComplaint(req, res, next) {
  try {
    const id = req.params.id;
    const row = await dal.getComplaintById(id);
    if (!row) return res.status(404).json({ ok: false, error: "not_found" });

    let secret = {};
    if (row.secret_json) {
      try {
        secret = decryptJSON(row.secret_json) || {};
      } catch {}
    }

    const description = row.description ?? secret.description ?? null;
    const filed_by = row.filed_by ?? secret.filed_by ?? null;
    const created_by_vit = row.created_by_vit ?? secret.created_by_vit ?? null;
    const verification_code = row.verification_code ?? secret.verification_code ?? null;

    const parties = await dal.getPartiesByComplaint(id);
    const attachments = await dal.getAttachmentsByComplaint(id);

    const payload = {
      cmpid: row.cmpid ?? id,
      title: row.title ?? row.title_preview ?? id,
      description,
      severity: row.severity,
      category: row.category,
      subcategory: row.subcategory,
      status: row.status,
      filed_by,
      created_by_vit,
      created_by_name: row.created_by_name || null,
      created_by_email: row.created_by_email || null,
      created_by_phone: row.created_by_phone || null,
      created_on: row.created_on,
      updated_on: row.updated_on,
      assigned_block: row.assigned_block,
      assigned_to: row.assigned_to,
      verification_code,
      parties,
      attachments,
      is_locked: !!row.is_locked,
      lock_owner_vit: row.lock_owner_vit || null,
      locked_on: row.locked_on || null,
      lock_reason: row.lock_reason || null,
    };

    return res.json({ ok: true, data: payload });
  } catch (e) {
    next(e);
  }
}

export async function updateFacultyComplaintFields(req, res, next) {
  try {
    const id = req.params.id;
    const actor = req.user?.vit_id || req.user?.name || "Faculty";

    const meta = await dal.getComplaintById(id);
    if (!meta) return res.status(404).json({ ok: false, error: "not_found" });
    if (meta.is_locked && !isAdmin(req)) return res.status(423).json({ ok: false, error: "locked" });

    const fields = {
      status: req.body.status,
      severity: req.body.severity,
      category: req.body.category,
      subcategory: req.body.subcategory,
      assigned_to: req.body.assigned_to,
      admin_notes: req.body.admin_notes || "",
    };

    const { ok, statusAfter } = await dal.updateComplaintFields(id, fields, actor);
    if (!ok) return res.status(404).json({ ok: false, error: "not_found" });

    if (fields.status) {
      const meta2 = await dal.getComplaintMeta(id);
      if (meta2) {
        let contact = await dal.getContactForVit(meta2.created_by_vit || "");
        let email = contact?.email || null;
        let name = contact?.full_name || null;
        if (!email) {
          const sec = await dal.getComplaintSecretRow(id);
          if (sec?.secret_json) {
            try {
              const s = decryptJSON(sec.secret_json) || {};
              email = s.email || s.reporter_email || null;
              name = name || s.name || s.reporter_name || null;
            } catch {}
          }
        }
        if (email) {
          try {
            await sendComplaintStatusUpdate(email, {
              complaint_id: meta2.complaint_id,
              status: statusAfter,
              title: meta2.title || meta2.title_preview || "",
              name: name || "",
            });
          } catch {}
        }
      }
    }

    return res.json({ ok: true, status: statusAfter || fields.status || null });
  } catch (e) {
    next(e);
  }
}

export async function lockFacultyComplaint(req, res, next) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ ok: false, error: "forbidden" });
    const id = req.params.id;
    const actor = req.user?.vit_id || req.user?.name || "FacultyAdmin";
    const reason = (req.body.reason || "").slice(0, 200);
    await dal.lockComplaint(id, actor, reason);
    return res.json({ ok: true, locked: true });
  } catch (e) {
    next(e);
  }
}

export async function unlockFacultyComplaint(req, res, next) {
  try {
    if (!isAdmin(req)) return res.status(403).json({ ok: false, error: "forbidden" });
    const id = req.params.id;
    const actor = req.user?.vit_id || req.user?.name || "FacultyAdmin";
    const reason = (req.body.reason || "").slice(0, 200);
    await dal.unlockComplaint(id, actor, reason);
    return res.json({ ok: true, locked: false });
  } catch (e) {
    next(e);
  }
}

export async function escalateFacultyComplaint(req, res, next) {
  try {
    const id = req.params.id;
    const actor = req.user?.vit_id || req.user?.name || "Faculty";
    const meta = await dal.getComplaintById(id);
    if (!meta) return res.status(404).json({ ok: false, error: "not_found" });
    if (meta.is_locked && !isAdmin(req)) return res.status(423).json({ ok: false, error: "locked" });

    const facultyId = String(req.body.facultyId || "").trim();
    const wardenVit = String(req.body.wardenVit || "").trim();
    const hostelType = String(req.body.hostelType || "").trim().toUpperCase();
    const block = String(req.body.block || "").trim().toUpperCase();
    const note = req.body.note || "";

    if (facultyId) {
      const success = await dal.assignComplaintToFaculty(id, facultyId, note, actor);
      if (!success) return res.status(404).json({ ok: false, error: "faculty_not_found" });
      return res.json({ ok: true });
    }

    if (wardenVit) {
      const success = await dal.assignComplaintToWardenByVit(id, wardenVit, note, actor);
      if (!success) return res.status(404).json({ ok: false, error: "warden_not_found" });
      return res.json({ ok: true });
    }

    if (hostelType && block) {
      const blockCode = `${hostelType}-${block}`;
      const success = await dal.assignComplaintToWardenByBlock(id, blockCode, note, actor);
      if (!success) return res.status(404).json({ ok: false, error: "warden_not_found" });
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "invalid_target" });
  } catch (e) {
    next(e);
  }
}

export async function getFacultyComplaintLogs(req, res, next) {
  try {
    const id = req.params.id;
    const rows = await dal.getLogs(id);
    return res.json({ ok: true, data: rows });
  } catch (e) {
    next(e);
  }
}
