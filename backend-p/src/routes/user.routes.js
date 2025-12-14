import { Router } from "express";
import { body, validationResult } from "express-validator";
import { loginLimiter } from "../middleware/rateLimit.js";
import { login } from "../controllers/auth.controller.js";

const router = Router();
router.post("/login", loginLimiter,
  body("username").isString().trim().notEmpty(),
  body("password").isString().isLength({min:6}),
  (req,res,next)=>{ const v=validationResult(req); if(!v.isEmpty()) return res.status(400).json({ok:false, errors:v.array()}); next(); },
  login
);
export default router;
