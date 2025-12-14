import { pool } from "../config/db.js";
export async function getAnyProfileByVitId(vit){
  const [s]=await pool.query(`SELECT * FROM student_profile WHERE vit_id=:v`,{v:vit});
  if(s[0]) return { role:"student", ...s[0] };
  const [f]=await pool.query(`SELECT * FROM faculty_profile WHERE vit_id=:v`,{v:vit});
  if(f[0]) return { role:"faculty", ...f[0] };
  const [w]=await pool.query(`SELECT * FROM warden_profile WHERE vit_id=:v`,{v:vit});
  if(w[0]) return { role:"warden", ...w[0] };
  const [g]=await pool.query(`SELECT * FROM security_profile WHERE vit_id=:v`,{v:vit});
  if(g[0]) return { role:"security", ...g[0] };
  return null;
}
