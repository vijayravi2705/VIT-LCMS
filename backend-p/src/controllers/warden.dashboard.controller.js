// src/controllers/warden.dashboard.controller.js
import {
  wardenDashboardSummary,
  wardenStatusBreakdown,
  wardenCategoryBreakdown,
  wardenEmergencyRecent,
} from "../dal/warden.dashboard.dal.js";

export async function wardenSummary(req, res, next) {
  try {
    const vit = req.user?.vit_id;
    if (!vit) return res.status(401).json({ ok: false, error: "no_token" });
    const data = await wardenDashboardSummary(vit);
    if (!data) return res.status(403).json({ ok: false, error: "no_block_scope" });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function wardenStatus(req, res, next) {
  try {
    const vit = req.user?.vit_id;
    if (!vit) return res.status(401).json({ ok: false, error: "no_token" });
    const items = await wardenStatusBreakdown(vit);
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
}

export async function wardenCategories(req, res, next) {
  try {
    const vit = req.user?.vit_id;
    if (!vit) return res.status(401).json({ ok: false, error: "no_token" });
    const months = Number(req.query.months) || 6;
    const items = await wardenCategoryBreakdown(vit, months);
    res.json({ ok: true, items, months: Number.isFinite(months) ? months : 6 });
  } catch (err) {
    next(err);
  }
}

export async function wardenEmergencies(req, res, next) {
  try {
    const vit = req.user?.vit_id;
    if (!vit) return res.status(401).json({ ok: false, error: "no_token" });
    const limit = Number(req.query.limit) || 20;
    const items = await wardenEmergencyRecent(vit, limit);
    res.json({ ok: true, items, limit: Number.isFinite(limit) ? limit : 20 });
  } catch (err) {
    next(err);
  }
}
