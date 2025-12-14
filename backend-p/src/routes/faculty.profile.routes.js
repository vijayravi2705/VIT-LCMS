import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getFacultyProfileByVitId } from "../dal/faculty.profile.dal.js";

const r = Router();

r.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const vit = req.user.vit_id;
    const profile = await getFacultyProfileByVitId(vit);
    // Always return something useful
    res.json({
      ok: true,
      profile: profile || {
        vit_id: vit,
        name: req.user?.name || vit,
        department: "",
        designation: "",
        contact: "",
        email: req.user?.email || ""
      }
    });
  } catch (e) {
    next(e);
  }
});

export default r;
