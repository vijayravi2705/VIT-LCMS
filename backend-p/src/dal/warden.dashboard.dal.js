// src/dal/warden.dashboard.dal.js
import { db } from "../db/mysql.js";

async function getWardenBlock(vit_id) {
  const [[row]] = await db.query(
    "SELECT block_code FROM warden_profile WHERE vit_id = ? LIMIT 1",
    [vit_id]
  );
  return row?.block_code || null;
}

export async function wardenDashboardSummary(vit_id) {
  const block = await getWardenBlock(vit_id);
  if (!block) return null;

  const [[my_reports]] = await db.query(
    "SELECT COUNT(*) AS n FROM complaint WHERE created_by_vit = ?",
    [vit_id]
  );
  const [[total]] = await db.query(
    "SELECT COUNT(*) AS n FROM complaint WHERE assigned_block = ?",
    [block]
  );
  const [[pending]] = await db.query(
    `
    SELECT COUNT(*) AS n
    FROM complaint
    WHERE assigned_block = ?
      AND status IN ('submitted', 'in_review', 'in_progress')
    `,
    [block]
  );
  const [[resolved]] = await db.query(
    `
    SELECT COUNT(*) AS n
    FROM complaint
    WHERE assigned_block = ?
      AND status = 'resolved'
    `,
    [block]
  );

  return {
    my_reports: Number(my_reports?.n || 0),
    total: Number(total?.n || 0),
    pending: Number(pending?.n || 0),
    resolved: Number(resolved?.n || 0),
    block,
  };
}

export async function wardenStatusBreakdown(vit_id) {
  const block = await getWardenBlock(vit_id);
  if (!block) return [];
  const [rows] = await db.query(
    `
    SELECT status AS name, COUNT(*) AS value
    FROM complaint
    WHERE assigned_block = ?
    GROUP BY status
    ORDER BY status
    `,
    [block]
  );
  return rows;
}

export async function wardenCategoryBreakdown(vit_id, months = 6) {
  const block = await getWardenBlock(vit_id);
  if (!block) return [];
  const period = Math.max(1, Math.min(60, Number(months) || 6));
  const [rows] = await db.query(
    `
    SELECT category AS name, COUNT(*) AS value
    FROM complaint
    WHERE assigned_block = ?
      AND created_on >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY category
    ORDER BY value DESC
    `,
    [block, period]
  );
  return rows;
}

export async function wardenEmergencyRecent(vit_id, limit = 20) {
  const block = await getWardenBlock(vit_id);
  if (!block) return [];
  const lim = Math.max(1, Math.min(100, Number(limit) || 20));
  const [rows] = await db.query(
    `
    SELECT
      complaint_id,
      COALESCE(title_preview, title) AS title_preview,
      category,
      status,
      severity,
      COALESCE(updated_on, created_on) AS updated_on
    FROM complaint
    WHERE assigned_block = ?
      AND severity = 'emergency'
    ORDER BY COALESCE(updated_on, created_on) DESC
    LIMIT ?
    `,
    [block, lim]
  );
  return rows;
}
