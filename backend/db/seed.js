import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const seedUsers = [
  {
    name: "Admin User",
    email: "admin@taskflow.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Manager User",
    email: "manager@taskflow.com",
    password: "Manager@123",
    role: "manager",
  },
  {
    name: "Employee User",
    email: "user@taskflow.com",
    password: "User@123",
    role: "employee",
  },
];

const runSeed = async () => {
  try {
    for (const user of seedUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email)
         DO UPDATE SET
           name = EXCLUDED.name,
           password = EXCLUDED.password,
           role = EXCLUDED.role`,
        [user.name, user.email, hashedPassword, user.role],
      );
    }

    console.log(
      "Seed completed: admin, manager, and employee users inserted/updated.",
    );
  } finally {
    await pool.end();
  }
};

runSeed().catch(async (error) => {
  console.error("Seed failed:", error);
  await pool.end();
  process.exit(1);
});
