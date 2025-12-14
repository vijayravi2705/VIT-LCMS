// src/dal/warden.directory.dal.js
import { db } from "../db/mysql.js";
import {
  getBlockForWarden,
  listComplaintsForWarden,
} from "./warden.complaints.dal.js";
import { wardenDashboardSummary } from "./warden.dashboard.dal.js";

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

const normalizeFilters = ({ q = "", hostelType = "", block = "" }) => ({
  q: String(q || "").trim(),
  hostelType: String(hostelType || "").trim().toUpperCase(),
  block: String(block || "").trim().toUpperCase(),
});

const applyDefaultProfileFields = (row = {}) => ({
  ...row,
  designation: row.designation ?? "",
  shift: row.shift ?? "",
  photo_url: row.photo_url ?? "",
});

const baseSelectProfileFields = `
  w.vit_id,
  w.full_name,
  w.email,
  w.phone,
  COALESCE(w.hostel_type, '') AS hostel_type,
  COALESCE(w.block_code, '')  AS block_code
`;

const selectMetrics = `
  COALESCE(queue.total_count, 0)    AS total_count,
  COALESCE(queue.pending_count, 0)  AS pending_count,
  COALESCE(queue.resolved_count, 0) AS resolved_count,
  COALESCE(queue.emergency_count,0) AS emergency_count,
  COALESCE(reports.reports_filed,0) AS reports_filed
`;

const joinedMetricsClause = `
  LEFT JOIN (
    SELECT
      assigned_to AS vit_id,
      COUNT(*) AS total_count,
      SUM(CASE WHEN status IN ('submitted','in_review','in_progress') THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
      SUM(CASE WHEN severity = 'emergency' AND status IN ('submitted','in_review','in_progress') THEN 1 ELSE 0 END) AS emergency_count
    FROM complaint
    WHERE assigned_to IS NOT NULL
    GROUP BY assigned_to
  ) queue ON queue.vit_id = w.vit_id
  LEFT JOIN (
    SELECT created_by_vit AS vit_id, COUNT(*) AS reports_filed
    FROM complaint
    GROUP BY created_by_vit
  ) reports ON reports.vit_id = w.vit_id
`;

const buildWhereClause = (filters, params) => {
  const { q, hostelType, block } = normalizeFilters(filters);
  const clauses = ["1=1"];

  if (q) {
    clauses.push(
      `(LOWER(w.full_name) LIKE ? OR LOWER(w.email) LIKE ? OR LOWER(w.phone) LIKE ? OR LOWER(w.vit_id) LIKE ?)`
    );
    const like = `%${q.toLowerCase()}%`;
    params.push(like, like, like, like);
  }

  if (hostelType) {
    clauses.push("UPPER(w.hostel_type) = ?");
    params.push(hostelType);
  }

  if (block) {
    clauses.push("UPPER(w.block_code) = ?");
    params.push(block);
  }

  return clauses.join(" AND ");
};

export async function listWardensDirectory({
  q = "",
  hostelType = "",
  block = "",
  page = 1,
  pageSize = 20,
  sort = "name",
}) {
  const params = [];
  const where = buildWhereClause({ q, hostelType, block }, params);

  const currentPage = clampNumber(page, 1, Number.MAX_SAFE_INTEGER, 1);
  const pageLimit = clampNumber(pageSize, 1, 100, 20);
  const offset = (currentPage - 1) * pageLimit;

  const orderBy =
    sort === "queue"
      ? "queue.pending_count DESC, w.full_name ASC"
      : "w.full_name ASC";

  const [rows] = await db.query(
    `
    SELECT
      ${baseSelectProfileFields},
      ${selectMetrics}
    FROM warden_profile w
    ${joinedMetricsClause}
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
    `,
    [...params, pageLimit, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM warden_profile w WHERE ${where}`,
    params
  );

  return {
    rows: rows.map(applyDefaultProfileFields),
    total: Number(total || 0),
    page: currentPage,
    pageSize: pageLimit,
  };
}

async function getWardenProfileWithMetrics(vit_id) {
  const [rows] = await db.query(
    `
    SELECT
      ${baseSelectProfileFields},
      ${selectMetrics}
    FROM warden_profile w
    ${joinedMetricsClause}
    WHERE w.vit_id = ?
    LIMIT 1
    `,
    [vit_id]
  );

  return rows.length ? applyDefaultProfileFields(rows[0]) : null;
}

export async function getWardenDirectoryEntry(vit_id, { limit = 50 } = {}) {
  const profile = await getWardenProfileWithMetrics(vit_id);
  if (!profile) return null;

  const summary = await wardenDashboardSummary(vit_id);
  const blockCode =
    summary?.block || profile.block_code || (await getBlockForWarden(vit_id));

  let complaints = [];
  let complaintsTotal = 0;

  if (blockCode) {
    const { rows, total } = await listComplaintsForWarden({
      block_code: blockCode,
      q: "",
      status: "",
      severity: "",
      sort: "recent",
      page: 1,
      pageSize: clampNumber(limit, 1, 100, 50),
    });
    complaints = rows;
    complaintsTotal = total;
  }

  return {
    profile,
    summary,
    complaints,
    complaintsTotal,
  };
}
