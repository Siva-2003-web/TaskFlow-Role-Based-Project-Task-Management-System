import jwt from "jsonwebtoken";
import { createHttpError } from "../utils/httpError.js";

const COOKIE_NAME = "token";

export const protect = (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return next(createHttpError(401, "Unauthorized: token missing"));
    }

    if (!process.env.JWT_SECRET) {
      return next(createHttpError(500, "JWT secret is not configured"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return next(createHttpError(401, "Unauthorized: invalid token"));
  }
};
