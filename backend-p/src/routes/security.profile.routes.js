import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { getSecurityProfile } from "../controllers/security.profile.controller.js";

const r = Router();
r.get("/security/profile", requireAuth, requireRole("security"), getSecurityProfile);
export default r;
