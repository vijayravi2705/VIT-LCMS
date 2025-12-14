import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();


const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "vit_hostel_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  const connectWithRetry = async () => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    console.log("✅ MySQL connected, test result:", rows?.[0]?.ok === 1 ? "OK" : rows);
  } catch (err) {
    console.error("[db] not ready, retrying in 5s...");
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

})();

export const db = pool;
export default pool;
