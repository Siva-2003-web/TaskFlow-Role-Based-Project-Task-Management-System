import { Router } from "express";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  listAvailableUsers,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = Router();

// Public routes (authenticated users)
router.get("/available", protect, listAvailableUsers);

// Admin-only routes
router.use(protect, isAdmin);

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
