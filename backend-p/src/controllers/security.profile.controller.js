import { getSecurityProfileByVitId } from "../dal/security.profile.dal.js";

export async function getSecurityProfile(req, res, next) {
  try {
    const vit_id = req.user?.vit_id;
    if (!vit_id) return res.status(401).json({ ok:false, error:"unauthorized" });
    const profile = await getSecurityProfileByVitId(vit_id);
    return res.json({ ok:true, profile });
  } catch (e) {
    next(e);
  }
}
