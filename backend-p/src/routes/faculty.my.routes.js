// src/routes/faculty.my.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.js";
import {
  mySubmissionsList,
  mySubmissionOne,
} from "../controllers/faculty.my.controller.js";

const router = Router();

// Allow standard, admin, and legacy numeric faculty roles
router.use(requireAuth, requireRole("faculty", "faculty_admin", "2"));

router.get("/submissions", mySubmissionsList);
router.get("/submissions/:id", mySubmissionOne);

export default router;
