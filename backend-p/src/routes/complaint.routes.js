import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { attachPermsIfMissing, requirePerm } from "../middleware/rbac.js";
import { newComplaintId, shortVerification } from "../utils/idgen.js";
import { encryptJSON, decryptJSON } from "../utils/crypto.js";
import {
  createComplaintTx,
  listComplaintsBasic,
  getComplaintFull,
  appendLog,
  lastLogHash,
  updateComplaintStatus,
  listComplaintsByUser
} from "../dal/complaint.dal.js";
import { sendComplaintReceipt } from "../utils/mailer.js";
import { getEmailByRoleAndVitId } from "../dal/userProfile.dal.js";

const r = Router();

const readPayload = (req) => req.body || {};

r.post(
  "/",
  requireAuth,
  attachPermsIfMissing,
  requirePerm("complaint:create", "complaint:create:self"),
  async (req, res, next) => {
    try {
      const body = readPayload(req);

      const complaint_id = newComplaintId();
      const verification_code = shortVerification();

      const secret_json = encryptJSON({
        title: body.title || "",
        description: body.description || ""
      });

      const title_preview = String(body.title || "").slice(0, 120);
      const assigned_block = body.assigned_block || null;

      const complaint = {
        complaint_id,
        title_preview,
        description: "",
        secret_json,
        severity: body.severity || "low",
        category: body.category || "other",
        subcategory: body.subcategory || null,
        status: "submitted",
        filed_by: String(body.filed_by || "student").toLowerCase(),
        created_by_vit: req.user.vit_id,
        created_on: new Date(),
        assigned_block,
        verification_code
      };

      const parties = Array.isArray(body.parties)
        ? body.parties.map((p, i) => ({
            cp_id: p.cp_id || 1000 + i,
            vit_id: p.vit_id,
            party_role: p.party_role,
            is_primary: !!p.is_primary,
            notes: p.notes || null
          }))
        : [];

      const firstLog = {
        log_id: 1,
        complaint_id,
        actor_vit_id: req.user.vit_id,
        action: "created",
        status_after: "submitted",
        notes: null,
        created_on: new Date()
      };

      const attachments = [];

      await createComplaintTx({ complaint, parties, firstLog, attachments });

      try {
        const recipient = await getEmailByRoleAndVitId(complaint.filed_by, req.user.vit_id);
        if (recipient?.email) {
          await sendComplaintReceipt({
            to: recipient.email,
            complaint_id,
            verification_code,
            name: recipient.full_name
          });
        }
      } catch {}

      res.json({ ok: true, complaint_id, verification_code });
    } catch (e) {
      next(e);
    }
  }
);

r.get("/", requireAuth, attachPermsIfMissing, async (req, res, next) => {
  try {
    const data = await listComplaintsBasic({
      limit: req.query.limit || 50,
      severity: req.query.severity,
      status: req.query.status
    });
    res.json({ ok: true, items: data });
  } catch (e) {
    next(e);
  }
});

r.get("/mine", requireAuth, attachPermsIfMissing, async (req, res, next) => {
  try {
    const data = await listComplaintsByUser({
      vit_id: req.user.vit_id,
      limit: req.query.limit || 50,
      status: req.query.status || undefined,
      severity: req.query.severity || undefined,
      q: req.query.q || undefined,
      order: req.query.order || "desc"
    });
    res.json({ ok: true, items: data });
  } catch (e) {
    next(e);
  }
});

r.get("/:id", requireAuth, attachPermsIfMissing, async (req, res, next) => {
  try {
    const out = await getComplaintFull(req.params.id);
    if (!out) return res.status(404).json({ ok: false, error: "not_found" });
    const decoded = decryptJSON(out.complaint.secret_json || "{}");
    out.complaint.title_plain = decoded.title || "";
    out.complaint.description_plain = decoded.description || "";
    res.json({ ok: true, ...out });
  } catch (e) {
    next(e);
  }
});

r.post(
  "/:id/escalate",
  requireAuth,
  attachPermsIfMissing,
  requirePerm("complaint:escalate"),
  async (req, res, next) => {
    try {
      const cid = req.params.id;
      const prev = await lastLogHash(cid);

      const log = {
        log_id: Date.now() % 1e9,
        complaint_id: cid,
        actor_vit_id: req.user.vit_id,
        action: "escalated",
        status_after: "in_progress",
        notes: req.body.notes || null,
        created_on: new Date()
      };

      const rh = await appendLog({ log, prevHash: prev });
      await updateComplaintStatus(cid, "in_progress");

      res.json({ ok: true, record_hash: rh });
    } catch (e) {
      next(e);
    }
  }
);

export default r;
