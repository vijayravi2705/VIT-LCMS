// src/routes/facultyreport.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";
import { attachPermsIfMissing, requireRole as rRequireRole } from "../middleware/rbac.js";
import { createFacultyReport } from "../controllers/faculty.report.controller.js";
console.log("[faculty.report.routes] LOADED");

const router = Router();

const dbg = (req, _res, next) => {
  console.log("[/api/faculty/report] user=", {
    vit_id: req.user?.vit_id,
    roles: req.user?.roles,
    perms: req.user?.perms,
    raw_roles: req.user?._raw?.roles ?? req.user?._raw?.role,
    raw_perms: req.user?._raw?.perms ?? req.user?._raw?.permissions,
  });
  next();
};

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const root = path.resolve(process.cwd(), "uploads", "complaints");
ensureDir(root);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, root),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "file", ext).replace(/[^\w.-]/g, "_");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
});

const allowFacultyOrCreate = [
  requireAuth,
  attachPermsIfMissing,
  (req, res, next) => {
    const perms = req.user?.perms || [];
    if (perms.includes("complaint:create") || perms.includes("complaint:create:all")) return next();
    return rRequireRole("faculty")(req, res, next);
  },
];

router.post(
  "/report",
  ...allowFacultyOrCreate,
  dbg,
  upload.array("attachments", 10),
  createFacultyReport
);

export default router;
