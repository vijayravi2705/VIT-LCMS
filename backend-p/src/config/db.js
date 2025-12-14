import mysql from "mysql2/promise";
import { env } from "./env.js";
export const pool = mysql.createPool({
  host: env.DB_HOST, port: env.DB_PORT,
  user: env.DB_USER, password: env.DB_PASS,
  database: env.DB_NAME, connectionLimit: 10,
  namedPlaceholders: true, timezone: "+00:00"
});
(async () => { try {
  const c = await pool.getConnection(); await c.ping(); c.release();
  console.log("[db] connected");
} catch(e){ console.error("[db] fail:", e.message); }})();
