import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { facultyDashboardCounts } from "../dal/analytics.dal.js";

const r = Router();

r.get("/faculty-dashboard", auth, async (req,res,next)=>{
  try{
    const data = await facultyDashboardCounts(req.user.vit_id);
    res.json({ ok:true, ...data });
  }catch(e){ next(e); }
});

export default r;
