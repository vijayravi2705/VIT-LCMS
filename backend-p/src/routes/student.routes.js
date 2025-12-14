// src/routes/student.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getStudentProfile, getStudentSummary } from "../controllers/student.controller.js";

const router = Router();

router.get("/profile", requireAuth, getStudentProfile);
router.get("/summary", requireAuth, getStudentSummary);

export default router;
