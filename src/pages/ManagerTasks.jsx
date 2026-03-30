import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
  addTask,
  updateTask,
  removeTask,
} from "../store/slices/taskSlice";
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
} from "../store/slices/projectSlice";
import { fetchUsersStart, fetchUsersSuccess } from "../store/slices/userSlice";
import taskService from "../api/taskService";
import projectService from "../api/projectService";
import userService from "../api/userService";
import Modal from "../components/Modal";
import "./ManagerTasks.css";

const EMPTY_TASK = {
  title: "",
  description: "",
  project: "",
  assignee: "",
  status: "pending",
  priority: "medium",
};
const STATUS_LIST = ["pending", "in-progress", "review", "completed"];
const PRIORITY_LIST = ["low", "medium", "high", "urgent"];

const ManagerTasks = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((s) => s.tasks);
  const { projects } = useSelector((s) => s.projects);
  const { users } = useSelector((s) => s.users);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [view, setView] = useState("list"); // 'list' | 'board'

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(EMPTY_TASK);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    dispatch(fetchTasksStart());
    try {
      const { data } = await taskService.getAll();
      dispatch(fetchTasksSuccess(data.tasks || data));
    } catch (err) {
      dispatch(
        fetchTasksFailure(
          err.response?.data?.message || "Failed to load tasks",
        ),
      );
    }
    dispatch(fetchProjectsStart());
    try {
      const { data } = await projectService.getAll();
      dispatch(fetchProjectsSuccess(data.projects || data));
    } catch {
      /* silent */
    }
    dispatch(fetchUsersStart());
    try {
      const { data } = await userService.getAvailable();
      dispatch(fetchUsersSuccess(data.users || data));
    } catch {
      /* silent */
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Assignable employees
  const employees = users.filter((u) => u.role === "employee");

  // Filter
  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchProject =
      projectFilter === "all" ||
      t.project === projectFilter ||
      t.project?._id === projectFilter;
    return matchSearch && matchStatus && matchProject;
  });

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  // Board columns
  const boardColumns = STATUS_LIST.map((s) => ({
    status: s,
    label:
      s === "in-progress"
        ? "In Progress"
        : s.charAt(0).toUpperCase() + s.slice(1),
    tasks: filtered.filter((t) => t.status === s),
  }));

  // Validation
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.project) e.project = "Please select a project";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Create
  const openCreate = () => {
    setFormMode("create");
    setForm(EMPTY_TASK);
    setFormErrors({});
    setEditingId(null);
    setShowForm(true);
  };

  // Edit
  const openEdit = (task) => {
    setFormMode("edit");
    setForm({
      title: task.title || "",
      description: task.description || "",
      project: task.project?._id || task.project || "",
      assignee: task.assignee?._id || task.assignee || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
    });
    setFormErrors({});
    setEditingId(task._id);
    setShowForm(true);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true);
    try {
      if (formMode === "create") {
        const { data } = await taskService.create(form);
        dispatch(addTask(data.task || data));
      } else {
        const { data } = await taskService.update(editingId, form);
        dispatch(updateTask(data.task || data));
      }
      setShowForm(false);
    } catch (err) {
      setFormErrors({
        server: err.response?.data?.message || "Operation failed",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const openDelete = (t) => {
    setDeleteTarget(t);
    setShowDelete(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await taskService.delete(deleteTarget._id);
      dispatch(removeTask(deleteTarget._id));
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helpers
  const getProjectName = (id) =>
    projects.find((p) => p._id === id || p._id === id?._id)?.name || "Unknown";
  const getAssigneeName = (id) =>
    users.find((u) => u._id === id || u._id === id?._id)?.name || "Unassigned";

  const statusIcon = (status) => {
    const map = {
      pending: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-status-icon mt-status-icon--pending"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      ),
      "in-progress": (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-status-icon mt-status-icon--progress"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      review: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-status-icon mt-status-icon--review"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      completed: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-status-icon mt-status-icon--completed"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    };
    return map[status] || map.pending;
  };

  const priorityBadge = (priority) => (
    <span className={`mt-priority mt-priority--${priority || "medium"}`}>
      {priority || "medium"}
    </span>
  );

  // Progress percentage
  const completionPct = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="mt-page animate-fade-in">
      {/* Header */}
      <div className="mt-header">
        <div>
          <h1 className="mt-header__title">Task Management</h1>
          <p className="mt-header__sub">
            Track, create, and assign tasks across your projects
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={openCreate}
          id="create-task-btn"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          New Task
        </button>
      </div>

      {/* Team Progress */}
      <div className="mt-progress-panel">
        <div className="mt-progress-panel__header">
          <h2 className="mt-progress-panel__title">Team Progress</h2>
          <span className="mt-progress-panel__pct">{completionPct}%</span>
        </div>
        <div className="mt-progress-panel__bar">
          <div
            className="mt-progress-panel__fill"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="mt-progress-panel__stats">
          <div className="mt-pstat">
            <span className="mt-pstat__dot mt-pstat__dot--pending" />
            <span className="mt-pstat__lbl">Pending</span>
            <span className="mt-pstat__val">{stats.pending}</span>
          </div>
          <div className="mt-pstat">
            <span className="mt-pstat__dot mt-pstat__dot--progress" />
            <span className="mt-pstat__lbl">In Progress</span>
            <span className="mt-pstat__val">{stats.inProgress}</span>
          </div>
          <div className="mt-pstat">
            <span className="mt-pstat__dot mt-pstat__dot--review" />
            <span className="mt-pstat__lbl">Review</span>
            <span className="mt-pstat__val">{stats.review}</span>
          </div>
          <div className="mt-pstat">
            <span className="mt-pstat__dot mt-pstat__dot--completed" />
            <span className="mt-pstat__lbl">Completed</span>
            <span className="mt-pstat__val">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-toolbar">
        <div className="users-search" style={{ flex: 1 }}>
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
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="users-search__input"
            id="mt-search"
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="form-select users-filter-select"
          id="mt-project-filter"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select users-filter-select"
          id="mt-status-filter"
        >
          <option value="all">All Status</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s === "in-progress"
                ? "In Progress"
                : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {/* View toggle */}
        <div className="mt-view-toggle">
          <button
            className={`mt-view-btn ${view === "list" ? "mt-view-btn--active" : ""}`}
            onClick={() => setView("list")}
            title="List View"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" x2="21" y1="6" y2="6" />
              <line x1="8" x2="21" y1="12" y2="12" />
              <line x1="8" x2="21" y1="18" y2="18" />
              <line x1="3" x2="3.01" y1="6" y2="6" />
              <line x1="3" x2="3.01" y1="12" y2="12" />
              <line x1="3" x2="3.01" y1="18" y2="18" />
            </svg>
          </button>
          <button
            className={`mt-view-btn ${view === "board" ? "mt-view-btn--active" : ""}`}
            onClick={() => setView("board")}
            title="Board View"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="users-error">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && !tasks.length && (
        <div className="users-loading">
          <div className="users-loading__spinner" />
          <span>Loading tasks…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
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
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="users-empty__title">
            {search || statusFilter !== "all" || projectFilter !== "all"
              ? "No matching tasks"
              : "No tasks found"}
          </h3>
          <p className="users-empty__desc">
            {search || statusFilter !== "all" || projectFilter !== "all"
              ? "Try adjusting your filters."
              : "Create your first task to start tracking work."}
          </p>
          {!search && statusFilter === "all" && projectFilter === "all" && (
            <button className="btn btn--primary" onClick={openCreate}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" x2="12" y1="5" y2="19" />
                <line x1="5" x2="19" y1="12" y2="12" />
              </svg>
              Create First Task
            </button>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {!loading && filtered.length > 0 && view === "list" && (
        <div className="mt-table-wrap">
          <table className="users-table" id="tasks-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr key={t._id || idx}>
                  <td>{statusIcon(t.status)}</td>
                  <td>
                    <div className="mt-task-title">{t.title}</div>
                    {t.description && (
                      <div className="mt-task-desc">{t.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="mt-project-tag">
                      {getProjectName(t.project)}
                    </span>
                  </td>
                  <td>
                    <div className="mt-assignee">
                      <div className="mt-assignee__avatar">
                        {getAssigneeName(t.assignee)
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </div>
                      <span>{getAssigneeName(t.assignee)}</span>
                    </div>
                  </td>
                  <td>{priorityBadge(t.priority)}</td>
                  <td>
                    <div className="users-actions">
                      <button
                        className="users-action-btn users-action-btn--edit"
                        title="Edit"
                        onClick={() => openEdit(t)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="users-action-btn users-action-btn--delete"
                        title="Delete"
                        onClick={() => openDelete(t)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── BOARD VIEW ── */}
      {!loading && filtered.length > 0 && view === "board" && (
        <div className="mt-board">
          {boardColumns.map((col) => (
            <div className="mt-board__col" key={col.status}>
              <div
                className={`mt-board__col-header mt-board__col-header--${col.status}`}
              >
                <span>{col.label}</span>
                <span className="mt-board__count">{col.tasks.length}</span>
              </div>
              <div className="mt-board__list">
                {col.tasks.length === 0 ? (
                  <div className="mt-board__empty">No tasks</div>
                ) : (
                  col.tasks.map((t, idx) => (
                    <div className="mt-board__card" key={t._id || idx}>
                      <div className="mt-board__card-top">
                        {priorityBadge(t.priority)}
                        <div className="mp-card__btns">
                          <button
                            className="users-action-btn users-action-btn--edit"
                            title="Edit"
                            onClick={() => openEdit(t)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="users-action-btn users-action-btn--delete"
                            title="Delete"
                            onClick={() => openDelete(t)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <h4 className="mt-board__card-title">{t.title}</h4>
                      {t.description && (
                        <p className="mt-board__card-desc">{t.description}</p>
                      )}
                      <div className="mt-board__card-footer">
                        <span className="mt-project-tag">
                          {getProjectName(t.project)}
                        </span>
                        <div className="mt-assignee mt-assignee--sm">
                          <div className="mt-assignee__avatar mt-assignee__avatar--sm">
                            {getAssigneeName(t.assignee)
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Create / Edit Modal ═══ */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formMode === "create" ? "Create Task" : "Edit Task"}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formErrors.server && (
            <div className="users-error" style={{ marginBottom: "1rem" }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" x2="9" y1="9" y2="15" />
                <line x1="9" x2="15" y1="9" y2="15" />
              </svg>
              <span>{formErrors.server}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className={`form-input ${formErrors.title ? "form-input--error" : ""}`}
              name="title"
              placeholder="e.g. Design landing page wireframe"
              value={form.title}
              onChange={handleChange}
              disabled={formLoading}
            />
            {formErrors.title && (
              <span className="form-error">{formErrors.title}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input mp-textarea"
              name="description"
              placeholder="Describe the task…"
              value={form.description}
              onChange={handleChange}
              disabled={formLoading}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Project</label>
              <select
                className={`form-select ${formErrors.project ? "form-input--error" : ""}`}
                name="project"
                value={form.project}
                onChange={handleChange}
                disabled={formLoading}
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {formErrors.project && (
                <span className="form-error">{formErrors.project}</span>
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Assignee</label>
              <select
                className="form-select"
                name="assignee"
                value={form.assignee}
                onChange={handleChange}
                disabled={formLoading}
              >
                <option value="">Unassigned</option>
                {employees.map((u) => (
                  <option key={u.id || u._id} value={u.id || u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={formLoading}
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s === "in-progress"
                      ? "In Progress"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                disabled={formLoading}
              >
                {PRIORITY_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setShowForm(false)}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <span
                    className="login-spinner"
                    style={{ width: 14, height: 14 }}
                  />{" "}
                  Saving…
                </>
              ) : formMode === "create" ? (
                "Create Task"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══ Delete Modal ═══ */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Task"
        size="sm"
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </div>
          <h3 className="confirm-dialog__title">Delete this task?</h3>
          <p className="confirm-dialog__desc">
            This will permanently remove{" "}
            <span className="confirm-dialog__name">{deleteTarget?.title}</span>.
          </p>
          <div className="form-actions">
            <button
              className="btn btn--ghost"
              onClick={() => setShowDelete(false)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn--danger"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <span
                    className="login-spinner"
                    style={{ width: 14, height: 14 }}
                  />{" "}
                  Deleting…
                </>
              ) : (
                "Delete Task"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerTasks;
