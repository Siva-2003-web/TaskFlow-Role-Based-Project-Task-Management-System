import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { createHttpError } from "../utils/httpError.js";

const COOKIE_NAME = "token";
const ALLOWED_ROLES = ["employee", "manager", "admin"];

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return next(
        createHttpError(400, "Name, email, and password are required"),
      );
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
      return next(createHttpError(400, "Invalid role selected"));
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
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createHttpError(400, "Email and password are required"));
    }

    if (!process.env.JWT_SECRET) {
      return next(createHttpError(500, "JWT secret is not configured"));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Raw SQL query to find user by email during login.
    const result = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return next(createHttpError(401, "Invalid email or password"));
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(createHttpError(401, "Invalid email or password"));
    }

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({ message: "Logout successful" });
};
