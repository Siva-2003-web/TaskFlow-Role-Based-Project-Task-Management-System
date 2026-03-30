import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const isProduction = process.env.NODE_ENV === "production";
const useSsl = process.env.DB_SSL === "true" || isProduction;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "taskflow",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export const testDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL");
  } finally {
    client.release();
  }
};
