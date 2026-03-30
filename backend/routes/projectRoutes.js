import { Router } from "express";
import {
  addProjectMember,
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../controllers/projectController.js";
import {
  createTaskForProject,
  listProjectTasks,
} from "../controllers/taskController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { isManager, isUser } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", protect, isUser, listProjects);
router.get("/:id/tasks", protect, isUser, listProjectTasks);
router.post("/", protect, isManager, createProject);
router.post("/:id/tasks", protect, isManager, createTaskForProject);
router.put("/:id", protect, isManager, updateProject);
router.delete("/:id", protect, isManager, deleteProject);
router.post("/:id/members", protect, isManager, addProjectMember);

export default router;
