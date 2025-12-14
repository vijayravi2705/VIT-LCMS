// src/routes/faculty.dashboard.routes.js
import { Router } from "express";
import {
  facultyDashSummary,
  facultyDashStatus,
  facultyDashCategories,
  facultyDashEmergencies,
} from "../controllers/faculty.dashboard.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const r = Router();

// Allow both standard faculty and elevated faculty-admin tokens (legacy numeric role "2" kept for seeds)
r.use(requireAuth, requireRole("faculty", "faculty_admin", "2"));

r.get("/faculty/dashboard/summary", facultyDashSummary);
r.get("/faculty/dashboard/status", facultyDashStatus);
r.get("/faculty/dashboard/categories", facultyDashCategories);
r.get("/faculty/dashboard/emergencies", facultyDashEmergencies);

export default r;
