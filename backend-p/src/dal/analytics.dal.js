import { pool } from "../config/db.js";

export async function facultyDashboardCounts(vitId){
  const [[myReports]] = await pool.query(
    `SELECT COUNT(*) c FROM complaint WHERE created_by_vit=:v`,{v:vitId});
  const [[pending]] = await pool.query(
    `SELECT COUNT(*) c FROM complaint WHERE status IN ('submitted','in_review','in_progress')`);
  const [[awaiting]] = await pool.query(
    `SELECT COUNT(*) c FROM complaint WHERE status IN ('submitted','in_review')`);
  const [[resolved]] = await pool.query(
    `SELECT COUNT(*) c FROM complaint WHERE status='resolved'`);
  const [emerg] = await pool.query(
    `SELECT complaint_id,title,category,status,created_on
       FROM complaint WHERE severity='emergency'
       ORDER BY created_on DESC LIMIT 10`);
  return {
    myReports: myReports.c, pending: pending.c, awaiting: awaiting.c, resolved: resolved.c, emergencyRecent: emerg
  };
}
