import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { getWardenProfile } from "../controllers/warden.profile.controller.js";

const r = Router();
r.get("/warden/profile", requireAuth, requireRole("warden"), getWardenProfile);
export default r;
