import fs from "fs";
import path from "path";
import multer from "multer";
import dayjs from "dayjs";
import { Router } from "express";
import { env } from "../config/env.js";
import { auth } from "../middleware/auth.js";
import { sha256FileHex } from "../utils/files.js";
import { pool } from "../config/db.js";

const r = Router();
if (!fs.existsSync(env.UPLOAD_DIR)) fs.mkdirSync(env.UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(env.UPLOAD_DIR, req.params.cid);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g,"_");
    cb(null, `${req.user.vit_id}_${safe}`);
  }
});
const upload = multer({ storage });

r.post("/:cid/upload", auth, upload.single("file"), async (req,res,next)=>{
  try{
    const file_path = req.file.path.replace(/\\/g,"/");
    const file_hash = sha256FileHex(file_path);
    await pool.query(
      `INSERT INTO attachment
       (att_id, complaint_id, uploader_vit, file_name, file_path, file_hash, uploaded_on)
       VALUES (:id,:cid,:vit,:name,:path,:hash,NOW())`,
      { id: Date.now()%1e9, cid: req.params.cid, vit: req.user.vit_id,
        name: req.file.originalname, path:file_path, hash:file_hash }
    );
    res.json({ ok:true, file_hash, uploaded_on: dayjs().toISOString() });
  }catch(e){ next(e); }
});

export default r;
