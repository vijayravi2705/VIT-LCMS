// src/dal/faculty.dashboard.dal.js
import { db } from "../db/mysql.js";

export async function getFacultySummary(userVitId) {
  const [rows] = await db.query(
    `
    SELECT
      SUM(CASE WHEN c.created_by_vit = ? THEN 1 ELSE 0 END)                                   AS my_reports,
      SUM(CASE WHEN c.status IN ('submitted','in_review','in_progress') THEN 1 ELSE 0 END)   AS pending_total,
      SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END)                                  AS resolved_total
    FROM complaint c
    `,
    [userVitId]
  );

  const row = rows[0] || {};
  return {
    myReports: Number(row.my_reports || 0),
    pendingTotal: Number(row.pending_total || 0),
    resolvedTotal: Number(row.resolved_total || 0),
  };
}

export async function getStatusBreakdown() {
  const [rows] = await db.query(
    `
    SELECT c.status AS name, COUNT(*) AS value
    FROM complaint c
    GROUP BY c.status
    ORDER BY c.status
    `
  );
  return rows.map((r) => ({
    name: r.name || "unknown",
    value: Number(r.value || 0),
  }));
}

export async function getCategoryBreakdown() {
  const [rows] = await db.query(
    `
    SELECT COALESCE(c.category, 'uncategorized') AS name, COUNT(*) AS value
    FROM complaint c
    GROUP BY COALESCE(c.category, 'uncategorized')
    ORDER BY name
    `
  );
  return rows.map((r) => ({
    name: r.name || "uncategorized",
    value: Number(r.value || 0),
  }));
}

export async function getRecentEmergencies(limit = 20) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const [rows] = await db.query(
    `
    SELECT
      c.complaint_id AS id,
      COALESCE(c.title, c.title_preview, '') AS title,
      COALESCE(c.category, '')              AS category,
      c.status,
      c.updated_on AS updatedOn
    FROM complaint c
    WHERE c.severity = 'emergency'
      AND c.status NOT IN ('resolved', 'rejected')
    ORDER BY c.updated_on DESC, c.complaint_id DESC
    LIMIT ?
    `,
    [safeLimit]
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title || "",
    category: r.category || "",
    status: r.status || "",
    updatedOn: r.updatedOn,
  }));
}
