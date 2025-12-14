import { Router } from "express";
import { authRequired } from "../middleware/auth.js"; // create this if you don't have

const r = Router();

r.get("/me", authRequired, (req, res) => {
  // req.user is set by authRequired (decoded JWT)
  res.json({
    ok: true,
    user: {
      user_id: req.user.sub,
      vit_id: req.user.vit_id,
      roles: req.user.roles,
      perms: req.user.perms,
    },
  });
});

export default r;
