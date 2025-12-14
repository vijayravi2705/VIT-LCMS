// src/routes/auth.routes.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { login } from "../controllers/auth.controller.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import bcrypt from "bcrypt";                  
import { db } from "../db/mysql.js";           // ✅ use db (your project uses db.execute/db.query)

const router = Router();

// ------------------------ VALIDATION ------------------------
const validateLogin = [
  body("username").isString().trim().notEmpty(),
  body("password").isString().isLength({ min: 3 }), // keep simple for dev
  (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ ok: false, errors: result.array() });
    }
    next();
  },
];

// ------------------------ MAIN LOGIN ------------------------
router.post("/login", loginLimiter, validateLogin, login);

// ------------------------ DEV: FIX HASH ----------------------
// This is just TEMPORARY — delete after login works ✅
router.post("/_dev/re-hash", async (req, res) => {
  try {
    const username = req.body.username || "faculty_demo";
    const password = req.body.password || "teach123";

    // make a new bcrypt hash
    const newHash = await bcrypt.hash(password, 10);

    // save into DB
    const [result] = await db.query(
      `UPDATE user_account
       SET password_hash = ?
       WHERE vtop_username = ?`,
      [newHash, username]
    );

    return res.json({
      ok: true,
      username,
      newHash,
      affectedRows: result.affectedRows,
    });

  } catch (err) {
    console.error("[_dev/re-hash]", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// ------------------------------------------------------------
export default router;
