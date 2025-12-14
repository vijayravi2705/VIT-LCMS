// src/controllers/warden.directory.controller.js
import {
  listWardensDirectory,
  getWardenDirectoryEntry,
} from "../dal/warden.directory.dal.js";

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

export async function listWardenDirectory(req, res, next) {
  try {
    const {
      q = "",
      hostelType = "",
      block = "",
      sort = "name",
      page = 1,
      pageSize = 20,
    } = req.query;

    const result = await listWardensDirectory({
      q,
      hostelType,
      block,
      sort,
      page,
      pageSize,
    });

    res.json({
      ok: true,
      data: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    next(err);
  }
}

export async function getWardenDirectoryProfile(req, res, next) {
  try {
    const vitId = req.params.vitId;
    const limit = clamp(req.query.limit ?? 50, 1, 100, 50);

    const entry = await getWardenDirectoryEntry(vitId, { limit });
    if (!entry) return res.status(404).json({ ok: false, error: "not_found" });

    res.json({
      ok: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
}
