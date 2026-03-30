import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const sqlPath = path.join(__dirname, "init.sql");
  const sql = await fs.readFile(sqlPath, "utf-8");

  await pool.query(sql);
  console.log("✅ Database initialized from db/init.sql");
  await pool.end();
};

run().catch(async (error) => {
  console.error("❌ Failed to initialize database:", error);
  await pool.end();
  process.exit(1);
});
