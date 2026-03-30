import { createHttpError } from "../utils/httpError.js";

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return next(createHttpError(401, "Unauthorized: user role missing"));
    }

    if (!allowedRoles.includes(role)) {
      return next(createHttpError(403, "Forbidden: insufficient permissions"));
    }

    return next();
  };
};

export const isAdmin = authorizeRole(["admin"]);
export const isManager = authorizeRole(["manager"]);
export const isUser = authorizeRole(["employee", "user", "manager", "admin"]);
