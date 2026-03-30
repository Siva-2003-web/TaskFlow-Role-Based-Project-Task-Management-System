import { pool } from "../config/db.js";
import { createHttpError } from "../utils/httpError.js";

const mapTaskForClient = (row) => ({
  ...row,
  _id: row.id,
  project: row.project_id,
  assignee: row.assigned_to,
});

const getProjectById = async (projectId) => {
  return pool.query("SELECT id, created_by FROM projects WHERE id = $1", [
    projectId,
  ]);
};

const getTaskById = async (taskId) => {
  return pool.query(
    `SELECT id, title, description, status, project_id, assigned_to, created_at
     FROM tasks
     WHERE id = $1`,
    [taskId],
  );
};

const managerOwnsProject = async (projectId, managerId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND created_by = $2",
    [projectId, managerId],
  );
  return result.rowCount > 0;
};

const userHasProjectAccess = async (projectId, userId, role) => {
  if (role === "admin") {
    return true;
  }

  if (role === "manager") {
    return managerOwnsProject(projectId, userId);
  }

  const membership = await pool.query(
    "SELECT project_id FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId],
  );
  return membership.rowCount > 0;
};

export const listTasks = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const assigneeFilter = req.query.assignee;

    if (role === "admin") {
      const result = await pool.query(
        `SELECT t.id, t.title, t.description, t.status, t.project_id, t.assigned_to, t.created_at, u.name AS assigned_user_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assigned_to
         ORDER BY t.created_at DESC`,
      );
      return res.status(200).json({ tasks: result.rows.map(mapTaskForClient) });
    }

    if (role === "manager") {
      const result = await pool.query(
        `SELECT t.id, t.title, t.description, t.status, t.project_id, t.assigned_to, t.created_at, u.name AS assigned_user_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.assigned_to
         WHERE p.created_by = $1
         ORDER BY t.created_at DESC`,
        [userId],
      );
      return res.status(200).json({ tasks: result.rows.map(mapTaskForClient) });
    }

    const targetAssignee = assigneeFilter || userId;
    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.status, t.project_id, t.assigned_to, t.created_at, u.name AS assigned_user_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.assigned_to = $1
       ORDER BY t.created_at DESC`,
      [targetAssignee],
    );

    return res.status(200).json({ tasks: result.rows.map(mapTaskForClient) });
  } catch (error) {
    return next(error);
  }
};

export const getTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { role, id: userId } = req.user;

    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.status, t.project_id, t.assigned_to, t.created_at
       FROM tasks t
       WHERE t.id = $1`,
      [taskId],
    );

    if (result.rowCount === 0) {
      return next(createHttpError(404, "Task not found"));
    }

    const task = result.rows[0];

    if (role === "manager") {
      const ownsProject = await managerOwnsProject(task.project_id, userId);
      if (!ownsProject) {
        return next(createHttpError(403, "Forbidden: cannot access this task"));
      }
    } else if (!["admin"].includes(role) && task.assigned_to !== userId) {
      return next(createHttpError(403, "Forbidden: cannot access this task"));
    }

    return res.status(200).json({ task: mapTaskForClient(task) });
  } catch (error) {
    return next(error);
  }
};

export const listProjectTasks = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { id: userId, role } = req.user;

    const project = await getProjectById(projectId);
    if (project.rowCount === 0) {
      return next(createHttpError(404, "Project not found"));
    }

    const hasAccess = await userHasProjectAccess(projectId, userId, role);
    if (!hasAccess) {
      return next(
        createHttpError(403, "Forbidden: cannot access tasks for this project"),
      );
    }

    const tasksResult = await pool.query(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.status,
         t.project_id,
         t.assigned_to,
         t.created_at,
         u.name AS assigned_user_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [projectId],
    );

    return res
      .status(200)
      .json({ tasks: tasksResult.rows.map(mapTaskForClient) });
  } catch (error) {
    return next(error);
  }
};

export const listTasksByProjectLegacy = async (req, res, next) => {
  req.params.id = req.params.projectId;
  return listProjectTasks(req, res, next);
};

export const createTask = async (req, res, next) => {
  req.params.id = req.body.projectId || req.body.project;
  req.body = {
    title: req.body.title,
    description: req.body.description,
    assignedTo: req.body.assignedTo ?? req.body.assignee,
    status: req.body.status,
  };

  return createTaskForProject(req, res, next);
};

export const createTaskForProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { title, description, assignedTo, status } = req.body;

    if (!title) {
      return next(createHttpError(400, "Task title is required"));
    }

    const ownsProject = await managerOwnsProject(projectId, req.user.id);
    if (!ownsProject) {
      const exists = await getProjectById(projectId);
      if (exists.rowCount === 0) {
        return next(createHttpError(404, "Project not found"));
      }
      return next(
        createHttpError(403, "Forbidden: cannot create tasks for this project"),
      );
    }

    if (assignedTo) {
      const userExists = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [assignedTo],
      );
      if (userExists.rowCount === 0) {
        return next(createHttpError(404, "Assigned user not found"));
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, project_id, assigned_to)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, status, project_id, assigned_to, created_at`,
      [
        title,
        description || null,
        status || "pending",
        projectId,
        assignedTo || null,
      ],
    );

    return res.status(201).json({
      message: "Task created successfully",
      task: mapTaskForClient(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { title, description } = req.body;
    const assignedTo = req.body.assignedTo ?? req.body.assignee;

    if (!title && description === undefined && assignedTo === undefined) {
      return next(
        createHttpError(400, "At least one field is required to update"),
      );
    }

    const taskResult = await getTaskById(taskId);
    if (taskResult.rowCount === 0) {
      return next(createHttpError(404, "Task not found"));
    }

    const currentTask = taskResult.rows[0];
    const ownsProject = await managerOwnsProject(
      currentTask.project_id,
      req.user.id,
    );
    if (!ownsProject) {
      return next(createHttpError(403, "Forbidden: cannot update this task"));
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const userExists = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [assignedTo],
      );
      if (userExists.rowCount === 0) {
        return next(createHttpError(404, "Assigned user not found"));
      }
    }

    const nextTitle = title ?? currentTask.title;
    const nextDescription = description ?? currentTask.description;
    const nextAssignedTo =
      assignedTo === undefined ? currentTask.assigned_to : assignedTo;

    const updatedResult = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, assigned_to = $3
       WHERE id = $4
       RETURNING id, title, description, status, project_id, assigned_to, created_at`,
      [nextTitle, nextDescription, nextAssignedTo, taskId],
    );

    return res.status(200).json({
      message: "Task updated successfully",
      task: mapTaskForClient(updatedResult.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return next(createHttpError(400, "status is required"));
    }

    const taskResult = await getTaskById(taskId);
    if (taskResult.rowCount === 0) {
      return next(createHttpError(404, "Task not found"));
    }

    const task = taskResult.rows[0];
    const { role, id: userId } = req.user;

    if (role === "manager") {
      const ownsProject = await managerOwnsProject(task.project_id, userId);
      if (!ownsProject) {
        return next(
          createHttpError(403, "Forbidden: cannot update status for this task"),
        );
      }
    } else {
      if (!["employee", "user"].includes(role)) {
        return next(
          createHttpError(
            403,
            "Forbidden: only manager or user can update status",
          ),
        );
      }

      if (task.assigned_to !== userId) {
        return next(
          createHttpError(
            403,
            "Forbidden: you can only update your assigned tasks",
          ),
        );
      }
    }

    const updatedResult = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2
       RETURNING id, title, description, status, project_id, assigned_to, created_at`,
      [status, taskId],
    );

    return res.status(200).json({
      message: "Task status updated successfully",
      task: mapTaskForClient(updatedResult.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;

    const taskResult = await getTaskById(taskId);
    if (taskResult.rowCount === 0) {
      return next(createHttpError(404, "Task not found"));
    }

    const task = taskResult.rows[0];
    const ownsProject = await managerOwnsProject(task.project_id, req.user.id);
    if (!ownsProject) {
      return next(createHttpError(403, "Forbidden: cannot delete this task"));
    }

    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
