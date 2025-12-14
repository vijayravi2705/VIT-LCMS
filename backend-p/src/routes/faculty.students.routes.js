// src/routes/faculty.students.routes.js
import { Router } from "express";
import {
  searchStudents,
  getStudentBundle,
  getComplaintDetails,
} from "../controllers/faculty.student.controller.js";
import { requireAuth, requireRole, requireAnyPerm } from "../middleware/auth.js";

const router = Router();

// Debug (temporary): see what the token contains
const whoami = (req, _res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[whoami]", { roles: req.user?.roles, perms: req.user?.perms });
  }
  next();
};

// Allow if the user is faculty OR has global read permission
const allowFacultyOrAll = [
  requireAuth,
  whoami,
  (req, res, next) => {
    if ((req.user?.perms || []).includes("complaint:read:all")) return next();
    return requireRole("faculty")(req, res, next);
  },
];

// If you’d rather gate purely by perms, use this instead:
// const allowRead = [requireAuth, requireAnyPerm("complaint:read:all","complaint:read:block")];

router.get("/search",                 ...allowFacultyOrAll, searchStudents);
router.get("/:vitId/bundle",          ...allowFacultyOrAll, getStudentBundle);
router.get("/complaints/:complaintId",...allowFacultyOrAll, getComplaintDetails);

export default router;
