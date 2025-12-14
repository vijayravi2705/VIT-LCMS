import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { attachPermsIfMissing, requireRole } from "../middleware/rbac.js";
import {
  listWardenComplaints,
  getWardenComplaint,
  updateWardenComplaint,
} from "../controllers/warden.complaints.controller.js";

const router = Router();

// Standard + legacy numeric warden roles
router.use(requireAuth, attachPermsIfMissing, requireRole("warden", "3"));

router.get("/", listWardenComplaints);
router.get("/:id", getWardenComplaint);
router.patch("/:id", updateWardenComplaint);

export default router;
