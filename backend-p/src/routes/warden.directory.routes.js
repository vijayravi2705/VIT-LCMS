// src/routes/warden.directory.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { attachPermsIfMissing, requireRole } from "../middleware/rbac.js";
import {
  listWardenDirectory,
  getWardenDirectoryProfile,
} from "../controllers/warden.directory.controller.js";

const router = Router();

// Allow wardens and faculty admins (legacy numeric codes included)
router.use(
  requireAuth,
  attachPermsIfMissing,
  requireRole("warden", "faculty_admin", "3", "2")
);

router.get("/", listWardenDirectory);
router.get("/:vitId", getWardenDirectoryProfile);

export default router;
