import {
  getBlockForWarden,
  listComplaintsForWarden,
  getComplaintFullForWarden,
  updateComplaintBasicForWarden,
} from "../dal/warden.complaints.dal.js";

const clamp = (val, min, max, fallback) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
};

export async function listWardenComplaints(req, res, next) {
  try {
    const vitId = req.user?.vit_id;
    const blockCode = vitId && (await getBlockForWarden(vitId));
    if (!blockCode) {
      return res.status(403).json({ ok: false, error: "warden_block_missing" });
    }

    const q = String(req.query.q ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const severity = String(req.query.priority ?? req.query.severity ?? "").trim();
    const sort = String(req.query.sort ?? "recent").trim();
    const page = clamp(req.query.page ?? 1, 1, Number.MAX_SAFE_INTEGER, 1);
    const pageSize = clamp(req.query.pageSize ?? req.query.limit ?? 10, 1, 100, 10);

    const { rows, total } = await listComplaintsForWarden({
      block_code: blockCode,
      q,
      status,
      severity,
      sort,
      page,
      pageSize,
    });

    return res.json({ ok: true, data: rows, total, page, pageSize });
  } catch (err) {
    next(err);
  }
}

export async function getWardenComplaint(req, res, next) {
  try {
    const vitId = req.user?.vit_id;
    const blockCode = vitId && (await getBlockForWarden(vitId));
    if (!blockCode) {
      return res.status(403).json({ ok: false, error: "warden_block_missing" });
    }

    const detail = await getComplaintFullForWarden({
      complaint_id: req.params.id,
      block_code: blockCode,
    });

    if (!detail) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    const { complaint, parties, logs, files } = detail;
    return res.json({
      ok: true,
      data: { ...complaint, parties, logs, attachments: files },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateWardenComplaint(req, res, next) {
  try {
    await updateComplaintBasicForWarden(req.params.id, {
      status: req.body.status ?? null,
      severity: req.body.severity ?? null,
      category: req.body.category ?? null,
      subcategory: req.body.subcategory ?? null,
      assigned_to: req.body.assigned_to ?? null,
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
