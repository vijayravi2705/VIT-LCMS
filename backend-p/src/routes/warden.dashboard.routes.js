// src/routes/warden.dashboard.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  wardenSummary,
  wardenStatus,
  wardenCategories,
  wardenEmergencies,
} from "../controllers/warden.dashboard.controller.js";

const router = Router();

// Allow string and legacy numeric warden role codes
router.use(requireAuth, requireRole("warden", "3"));

router.get("/summary", wardenSummary);
router.get("/status", wardenStatus);
router.get("/categories", wardenCategories);
router.get("/emergencies", wardenEmergencies);

export default router;
