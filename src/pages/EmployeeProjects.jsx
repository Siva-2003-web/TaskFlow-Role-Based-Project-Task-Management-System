import { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
} from "../store/slices/projectSlice";
import {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
} from "../store/slices/taskSlice";
import projectService from "../api/projectService";
import taskService from "../api/taskService";
import "./EmployeeProjects.css";

const EmployeeProjects = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { projects, loading: projectsLoading } = useSelector((s) => s.projects);
  const { tasks } = useSelector((s) => s.tasks);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    // Fetch projects
    dispatch(fetchProjectsStart());
    try {
      const { data } = await projectService.getAll();
      dispatch(fetchProjectsSuccess(data.projects || data));
    } catch (err) {
      dispatch(
        fetchProjectsFailure(
          err.response?.data?.message || "Failed to load projects",
        ),
      );
    }

    // Fetch tasks
    dispatch(fetchTasksStart());
    try {
      const { data } = await taskService.getAll({ assignee: user?._id });
      dispatch(fetchTasksSuccess(data.tasks || data));
    } catch (err) {
      dispatch(
        fetchTasksFailure(
          err.response?.data?.message || "Failed to load tasks",
        ),
      );
    }
  }, [dispatch, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter projects by search
  const filtered = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  // Calculate task stats per project
  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(
      (t) => (t.project?._id || t.project) === projectId,
    );
    const total = projectTasks.length;
    const completed = projectTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const inProgress = projectTasks.filter(
      (t) => t.status === "in-progress",
    ).length;
    const pending = projectTasks.filter((t) => t.status === "pending").length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, progress };
  };

  const statusDotClass = (status) => {
    const map = {
      pending: "ep-dot--pending",
      "in-progress": "ep-dot--progress",
      completed: "ep-dot--completed",
    };
    return `ep-dot ${map[status] || map.pending}`;
  };

  return (
    <div className="ep-page animate-fade-in">
      {/* Header */}
      <div className="ep-header">
        <div>
          <h1 className="ep-header__title">My Projects</h1>
          <p className="ep-header__sub">
            View and manage your assigned projects
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="ep-toolbar">
        <div className="users-search" style={{ maxWidth: "400px" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="users-search__icon"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="users-search__input"
            id="ep-search"
          />
        </div>
      </div>

      {/* Loading */}
      {projectsLoading && !projects.length && (
        <div className="users-loading">
          <div className="users-loading__spinner" />
          <span>Loading your projects…</span>
        </div>
      )}

      {/* Empty State */}
      {!projectsLoading && filtered.length === 0 && (
        <div className="users-empty">
          <div className="users-empty__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <h3 className="users-empty__title">
            {search ? "No matching projects" : "No projects assigned"}
          </h3>
          <p className="users-empty__desc">
            {search
              ? "Try adjusting your search."
              : "Your manager hasn't assigned you to any projects yet. Check back later!"}
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {!projectsLoading && filtered.length > 0 && (
        <div className="ep-projects-grid">
          {filtered.map((p) => {
            const stats = getProjectStats(p._id || p.id);
            return (
              <div className="ep-project-card" key={p._id || p.id}>
                <div className="ep-project-card__header">
                  <div className="ep-project-card__icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                  </div>
                  <span className="ep-project-card__creator">
                    by {p.creator_name || "Unknown"}
                  </span>
                </div>

                <h3 className="ep-project-card__name">{p.name}</h3>
                {p.description && (
                  <p className="ep-project-card__desc">{p.description}</p>
                )}

                {/* Task breakdown */}
                <div className="ep-project-card__breakdown">
                  <div className="ep-breakdown-item">
                    <span className={statusDotClass("pending")} />
                    <span className="ep-breakdown-label">
                      {stats.pending} pending
                    </span>
                  </div>
                  <div className="ep-breakdown-item">
                    <span className={statusDotClass("in-progress")} />
                    <span className="ep-breakdown-label">
                      {stats.inProgress} active
                    </span>
                  </div>
                  <div className="ep-breakdown-item">
                    <span className={statusDotClass("completed")} />
                    <span className="ep-breakdown-label">
                      {stats.completed} done
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="ep-project-card__progress-wrap">
                  <div className="ep-project-card__progress-bar">
                    <div
                      className="ep-project-card__progress-fill"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                  <span className="ep-project-card__progress-text">
                    {stats.total} task{stats.total !== 1 ? "s" : ""} •{" "}
                    {stats.progress}% complete
                  </span>
                </div>

                {/* CTA */}
                <Link to="/tasks" className="ep-project-card__link">
                  View Tasks →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeProjects;
