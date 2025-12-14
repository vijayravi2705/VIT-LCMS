// src/routes/faculty.complaints.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getComplaintDetails } from "../controllers/faculty.student.controller.js";
import {
  listFacultyComplaints,
  getOneFacultyComplaint,
  updateFacultyComplaintFields,
  escalateFacultyComplaint,
  getFacultyComplaintLogs,
  lockFacultyComplaint,
  unlockFacultyComplaint,
} from "../controllers/faculty.complaints.controller.js";

const router = Router();

// Accept standard and legacy faculty role codes
router.use(requireAuth, requireRole("faculty", "faculty_admin", "2"));

router.get("/", listFacultyComplaints);
router.get("/:id", getOneFacultyComplaint);
router.patch("/:id", updateFacultyComplaintFields);
router.post("/:id/escalate", escalateFacultyComplaint);
router.get("/:id/logs", getFacultyComplaintLogs);
router.post("/:id/lock", lockFacultyComplaint);
router.post("/:id/unlock", unlockFacultyComplaint);

// Student profile complaint detail
router.get("/:complaintId/details", getComplaintDetails);

export default router;
