// src/controllers/faculty.dashboard.controller.js
import {
  getFacultySummary,
  getStatusBreakdown,
  getCategoryBreakdown,
  getRecentEmergencies,
} from "../dal/faculty.dashboard.dal.js";

const userIdFromRequest = (req) =>
  req.user?.vit_id ||
  req.user?.sub ||
  req.user?._raw?.vit_id ||
  null;

export async function facultyDashSummary(req, res, next) {
  try {
    const me = userIdFromRequest(req);
    if (!me) return res.status(400).json({ ok: false, error: "missing_user" });

    const summary = await getFacultySummary(me);
    return res.json({
      ok: true,
      myReports: summary.myReports,
      pending: summary.pendingTotal,
      resolved: summary.resolvedTotal,
    });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashStatus(req, res, next) {
  try {
    const items = await getStatusBreakdown();
    return res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashCategories(req, res, next) {
  try {
    const items = await getCategoryBreakdown();
    return res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
}

export async function facultyDashEmergencies(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 20;
    const items = await getRecentEmergencies(limit);
    return res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
}
