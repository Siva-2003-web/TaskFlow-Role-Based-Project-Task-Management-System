import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { createHttpError } from "../utils/httpError.js";

export const listUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC`,
    );

    return res.status(200).json({ users: result.rows });
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return next(
        createHttpError(400, "Name, email, and password are required"),
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail],
    );
    if (existingUser.rowCount > 0) {
      return next(createHttpError(400, "User already exists with this email"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, normalizedEmail, hashedPassword, role || "employee"],
    );

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const existingResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [id],
    );
    if (existingResult.rowCount === 0) {
      return next(createHttpError(404, "User not found"));
    }

    const existingUser = existingResult.rows[0];

    const nextName = name ?? existingUser.name;
    const nextEmail = email ? email.toLowerCase().trim() : existingUser.email;
    const nextRole = role ?? existingUser.role;

    if (nextEmail !== existingUser.email) {
      const emailConflict = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id <> $2",
        [nextEmail, id],
      );
      if (emailConflict.rowCount > 0) {
        return next(
          createHttpError(400, "Another user already uses this email"),
        );
      }
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `UPDATE users
         SET name = $1, email = $2, password = $3, role = $4
         WHERE id = $5
         RETURNING id, name, email, role, created_at`,
        [nextName, nextEmail, hashedPassword, nextRole, id],
      );

      return res.status(200).json({
        message: "User updated successfully",
        user: result.rows[0],
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, role = $3
       WHERE id = $4
       RETURNING id, name, email, role, created_at`,
      [nextName, nextEmail, nextRole, id],
    );

    return res.status(200).json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name, email, role, created_at",
      [id],
    );

    if (result.rowCount === 0) {
      return next(createHttpError(404, "User not found"));
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

// Get available employees for project member assignment
export const listAvailableUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE role = 'employee'
       ORDER BY name ASC`,
    );

    return res.status(200).json({ users: result.rows });
  } catch (error) {
    return next(error);
  }
};
