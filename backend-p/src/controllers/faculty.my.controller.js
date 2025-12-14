// src/controllers/faculty.my.controller.js
import {
  listMySubmissions,
  getMySubmissionById,
} from "../dal/faculty.my.dal.js";

const titleCase = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export async function mySubmissionsList(req, res, next) {
  try {
    const vit_id = req.user?.vit_id;
    if (!vit_id) return res.status(401).json({ ok: false, error: "no_token" });

    const {
      page = 1,
      limit = 20,
      q = "",
      status = "",
      severity = "",
      order = "desc",
    } = req.query;

    const { rows, total } = await listMySubmissions({
      vit_id,
      page,
      limit,
      q: String(q || "").trim(),
      status: String(status || "").trim(),
      severity: String(severity || "").trim(),
      order: String(order || "").trim().toLowerCase(),
    });

    const data = rows.map((row) => {
      let bundle = {};
      try {
        bundle = row.secret_json ? JSON.parse(row.secret_json) : {};
      } catch {
        bundle = {};
      }

      return {
        id: row.id,
        title: row.title || "",
        cat: row.cat || "",
        priority: titleCase(row.priority || ""),
        status: row.status || "",
        updated: row.updated_on || row.created_on || null,
        assigned_block: row.assigned_block || null,
        location: bundle.location || "",
      };
    });

    res.json({ ok: true, total, data });
  } catch (err) {
    next(err);
  }
}

export async function mySubmissionOne(req, res, next) {
  try {
    const vit_id = req.user?.vit_id;
    if (!vit_id) return res.status(401).json({ ok: false, error: "no_token" });

    const { id } = req.params;
    const result = await getMySubmissionById({ id, vit_id });
    if (!result) return res.status(404).json({ ok: false, error: "not_found" });

    const { row, attachments, parties, fac } = result;

    let bundle = {};
    try {
      bundle = row.secret_json ? JSON.parse(row.secret_json) : {};
    } catch {
      bundle = {};
    }

    const mapParty = (roleFilter, defaults = {}) =>
      parties
        .filter((p) => p.party_role === roleFilter)
        .map((p) => ({
          name: p.full_name || p.vit_id,
          reg: p.vit_id,
          contact: p.phone || "",
          description: p.notes || "",
          ...defaults,
        }));

    const response = {
      id: row.complaint_id,
      title: row.title || row.title_preview || "",
      cat: row.category || "",
      priority: titleCase(row.severity || ""),
      status: row.status || "",
      location: bundle.location || "",
      subcategory: row.subcategory || bundle.subcategory || "",
      incidentDateTime: bundle.incident_dt || bundle.incidentDateTime || "",
      titleSubmitted: bundle.title || row.title || "",
      submittedAt: row.created_on || null,
      assignedTo: row.assigned_to || "",
      facultyId: row.created_by_vit,
      facultyName: fac?.full_name || "",
      facultyDept: fac?.department || "",
      facultyDesignation: fac?.designation || "",
      facultyContact: fac?.phone || "",
      victims: mapParty("victim"),
      accused: mapParty("accused", { role: "student" }),
      witnesses: mapParty("witness"),
      tags: Array.isArray(bundle.tags) ? bundle.tags : [],
      summary: bundle.summary || "",
      details: row.description || bundle.details || "",
      attachments: attachments.map((a) => ({
        name: a.name,
        hash: a.hash,
        ts: a.ts,
      })),
    };

    res.json({ ok: true, data: response });
  } catch (err) {
    next(err);
  }
}
