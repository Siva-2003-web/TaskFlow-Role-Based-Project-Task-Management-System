import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  listTasksByProjectLegacy,
  updateTask,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { isManager, isUser } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", protect, isUser, listTasks);
router.get("/project/:projectId", protect, isUser, listTasksByProjectLegacy);
router.get("/:id", protect, isUser, getTask);
router.post("/", protect, isManager, createTask);
router.put("/:id", protect, isManager, updateTask);
router.patch("/:id/status", protect, isUser, updateTaskStatus);
router.delete("/:id", protect, isManager, deleteTask);

export default router;
