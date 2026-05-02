import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  const sqlPath = path.join(__dirname, "migrate.sql");
  const sql = await fs.readFile(sqlPath, "utf-8");

  try {
    await pool.query(sql);
    console.log("✅ Database migration completed successfully");
    console.log("✓ Added priority column to tasks (default: 'medium')");
    console.log("✓ Added due_date column to tasks");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

runMigration()
  .then(() => pool.end())
  .catch(async (error) => {
    await pool.end();
    process.exit(1);
  });
