import { pool } from "../config/db.js";
import { createHttpError } from "../utils/httpError.js";

const selectProjectsBase = `
  SELECT
    p.id,
    p.name,
    p.description,
    p.created_by,
    p.created_at,
    u.name AS creator_name
  FROM projects p
  JOIN users u ON u.id = p.created_by
`;

const getOwnedProject = async (projectId, managerId) => {
  const ownedProject = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND created_by = $2",
    [projectId, managerId],
  );
  return ownedProject.rowCount > 0;
};

export const listProjects = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    if (role === "admin") {
      const result = await pool.query(
        `${selectProjectsBase} ORDER BY p.created_at DESC`,
      );
      // Fetch members for each project
      const projects = await Promise.all(
        result.rows.map(async (project) => {
          const members = await pool.query(
            "SELECT u.id, u.name, u.email, u.role FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = $1",
            [project.id],
          );
          return { ...project, members: members.rows };
        }),
      );
      return res.status(200).json({ projects });
    }

    if (role === "manager") {
      const result = await pool.query(
        `${selectProjectsBase} WHERE p.created_by = $1 ORDER BY p.created_at DESC`,
        [userId],
      );
      // Fetch members for each project
      const projects = await Promise.all(
        result.rows.map(async (project) => {
          const members = await pool.query(
            "SELECT u.id, u.name, u.email, u.role FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = $1",
            [project.id],
          );
          return { ...project, members: members.rows };
        }),
      );
      return res.status(200).json({ projects });
    }

    const result = await pool.query(
      `${selectProjectsBase}
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId],
    );
    // Fetch members for each project
    const projects = await Promise.all(
      result.rows.map(async (project) => {
        const members = await pool.query(
          "SELECT u.id, u.name, u.email, u.role FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = $1",
          [project.id],
        );
        return { ...project, members: members.rows };
      }),
    );

    return res.status(200).json({ projects });
  } catch (error) {
    return next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(createHttpError(400, "Project name is required"));
    }

    const result = await pool.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by, created_at`,
      [name, description || null, req.user.id],
    );

    return res.status(201).json({
      message: "Project created successfully",
      project: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && description === undefined) {
      return next(
        createHttpError(400, "At least one field is required to update"),
      );
    }

    const owned = await getOwnedProject(id, req.user.id);
    if (!owned) {
      const exists = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (exists.rowCount === 0) {
        return next(createHttpError(404, "Project not found"));
      }
      return next(
        createHttpError(403, "Forbidden: cannot update this project"),
      );
    }

    const projectResult = await pool.query(
      "SELECT name, description FROM projects WHERE id = $1",
      [id],
    );
    const currentProject = projectResult.rows[0];

    const nextName = name ?? currentProject.name;
    const nextDescription = description ?? currentProject.description;

    const result = await pool.query(
      `UPDATE projects
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING id, name, description, created_by, created_at`,
      [nextName, nextDescription, id],
    );

    return res.status(200).json({
      message: "Project updated successfully",
      project: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const owned = await getOwnedProject(id, req.user.id);
    if (!owned) {
      const exists = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (exists.rowCount === 0) {
        return next(createHttpError(404, "Project not found"));
      }
      return next(
        createHttpError(403, "Forbidden: cannot delete this project"),
      );
    }

    await pool.query("DELETE FROM projects WHERE id = $1", [id]);

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return next(createHttpError(400, "userId is required"));
    }

    const owned = await getOwnedProject(projectId, req.user.id);
    if (!owned) {
      const exists = await pool.query("SELECT id FROM projects WHERE id = $1", [
        projectId,
      ]);
      if (exists.rowCount === 0) {
        return next(createHttpError(404, "Project not found"));
      }
      return next(
        createHttpError(
          403,
          "Forbidden: cannot manage members for this project",
        ),
      );
    }

    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);
    if (userExists.rowCount === 0) {
      return next(createHttpError(404, "User not found"));
    }

    const insertResult = await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING project_id, user_id`,
      [projectId, userId],
    );

    if (insertResult.rowCount === 0) {
      return res
        .status(200)
        .json({ message: "User is already a project member" });
    }

    return res.status(201).json({
      message: "Project member added successfully",
      membership: insertResult.rows[0],
    });
  } catch (error) {
    return next(error);
  }
};
