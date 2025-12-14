import dotenv from "dotenv";
dotenv.config();
export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: +process.env.DB_PORT || 3306,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || "20m",
  APP_ENC_KEY: process.env.APP_ENC_KEY,     // base64
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads"
};
