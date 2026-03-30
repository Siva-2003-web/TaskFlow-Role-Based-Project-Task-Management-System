import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  addProject,
  updateProject,
  removeProject,
} from "../store/slices/projectSlice";
import {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
} from "../store/slices/userSlice";
import projectService from "../api/projectService";
import userService from "../api/userService";
import Modal from "../components/Modal";
import "./ManagerProjects.css";

const EMPTY_FORM = { name: "", description: "", deadline: "", members: [] };
const STATUS_OPTIONS = ["active", "on-hold", "completed"];

const ManagerProjects = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((s) => s.projects);
  const { users } = useSelector((s) => s.users);
  const { user: me } = useSelector((s) => s.auth);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Multi-select dropdown
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  // Fetch projects + users (for member assignment)
  const fetchData = useCallback(async () => {
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
    // Fetch available users (employees and managers) for member assignment
    dispatch(fetchUsersStart());
    try {
      const { data } = await userService.getAvailable();
      dispatch(fetchUsersSuccess(data.users || data));
    } catch (err) {
      dispatch(
        fetchUsersFailure(
          err.response?.data?.message || "Failed to load users",
        ),
      );
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter
  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Available employees for assignment (only employees, not managers)
  const assignableUsers = users.filter((u) => u.role === "employee");

  // Validation
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Project name is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Toggle member in multi-select
  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  // Create
  const openCreate = () => {
    setFormMode("create");
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setShowForm(true);
  };

  // Edit
  const openEdit = (project) => {
    setFormMode("edit");
    setForm({
      name: project.name || "",
      description: project.description || "",
      deadline: project.deadline ? project.deadline.slice(0, 10) : "",
      members: project.members?.map((m) => m._id || m.id || m) || [],
      status: project.status || "active",
    });
    setFormErrors({});
    setEditingId(project._id || project.id);
    setShowForm(true);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true);
    try {
      // Prepare project data (only fields the backend accepts)
      const projectData = {
        name: form.name,
        description: form.description,
      };

      let projectId;
      if (formMode === "create") {
        const { data } = await projectService.create(projectData);
        const newProject = data.project || data;
        projectId = newProject._id || newProject.id;
        dispatch(addProject(newProject));
      } else {
        const { data } = await projectService.update(editingId, projectData);
        const updatedProject = data.project || data;
        projectId = updatedProject._id || updatedProject.id;
        dispatch(updateProject(updatedProject));
      }

      // Add members to the project after creation/update
      if (form.members && form.members.length > 0) {
        try {
          await projectService.addMembers(projectId, form.members);
        } catch (memberErr) {
          console.warn("Failed to add some members:", memberErr);
          // Don't fail the entire operation if member assignment fails
        }
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
  const openDelete = (p) => {
    setDeleteTarget(p);
    setShowDelete(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const id = deleteTarget._id || deleteTarget.id;
      await projectService.delete(id);
      dispatch(removeProject(id));
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusBadge = (status) => {
    const cls = {
      active: "mp-badge--active",
      completed: "mp-badge--completed",
      "on-hold": "mp-badge--hold",
    };
    return (
      <span className={`mp-badge ${cls[status] || cls.active}`}>
        {status || "active"}
      </span>
    );
  };

  const getMemberName = (id) => {
    const u = assignableUsers.find((u) => (u._id || u.id) === id);
    return u?.name || id;
  };

  return (
    <div className="mp-page animate-fade-in">
      {/* Header */}
      <div className="mp-header">
        <div>
          <h1 className="mp-header__title">My Projects</h1>
          <p className="mp-header__sub">
            Create, manage, and assign team members to projects
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={openCreate}
          id="create-project-btn"
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
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="mp-stats">
        <div className="mp-stat">
          <span className="mp-stat__val">{projects.length}</span>
          <span className="mp-stat__lbl">Total</span>
        </div>
        <div className="mp-stat mp-stat--green">
          <span className="mp-stat__val">
            {projects.filter((p) => p.status === "active" || !p.status).length}
          </span>
          <span className="mp-stat__lbl">Active</span>
        </div>
        <div className="mp-stat mp-stat--amber">
          <span className="mp-stat__val">
            {projects.filter((p) => p.status === "on-hold").length}
          </span>
          <span className="mp-stat__lbl">On Hold</span>
        </div>
        <div className="mp-stat mp-stat--blue">
          <span className="mp-stat__val">
            {projects.filter((p) => p.status === "completed").length}
          </span>
          <span className="mp-stat__lbl">Completed</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mp-toolbar">
        <div className="users-search">
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
            id="mp-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select users-filter-select"
          id="mp-status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
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
      {loading && !projects.length && (
        <div className="users-loading">
          <div className="users-loading__spinner" />
          <span>Loading projects…</span>
        </div>
      )}

      {/* Project Cards or Empty */}
      {!loading && filtered.length === 0 ? (
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
            {search || statusFilter !== "all"
              ? "No matching projects"
              : "No projects yet"}
          </h3>
          <p className="users-empty__desc">
            {search || statusFilter !== "all"
              ? "Try adjusting your criteria."
              : "Create your first project to start managing tasks."}
          </p>
          {!search && statusFilter === "all" && (
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
              Create First Project
            </button>
          )}
        </div>
      ) : (
        !loading && (
          <div className="mp-grid">
            {filtered.map((p, idx) => (
              <div className="mp-card" key={p._id || p.id || idx}>
                <div className="mp-card__top">
                  <div className="mp-card__icon">
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
                  <div className="mp-card__actions-row">
                    {statusBadge(p.status)}
                    <div className="mp-card__btns">
                      <button
                        className="users-action-btn users-action-btn--edit"
                        title="Edit"
                        onClick={() => openEdit(p)}
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
                        onClick={() => openDelete(p)}
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
                </div>
                <h3 className="mp-card__name">{p.name}</h3>
                <p className="mp-card__desc">
                  {p.description || "No description."}
                </p>
                {/* Members avatars */}
                <div className="mp-card__members">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: 14,
                      height: 14,
                      flexShrink: 0,
                      color: "var(--color-text-dim)",
                    }}
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <span className="mp-card__member-count">
                    {p.members?.length || 0} member
                    {(p.members?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                {/* Progress */}
                <div className="project-card__progress">
                  <div className="project-card__progress-header">
                    <span>Progress</span>
                    <span>{p.progress || 0}%</span>
                  </div>
                  <div className="project-card__progress-bar">
                    <div
                      className="project-card__progress-fill"
                      style={{ width: `${p.progress || 0}%` }}
                    />
                  </div>
                </div>
                {p.deadline && (
                  <div className="mp-card__deadline">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 13, height: 13 }}
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>
                      Due{" "}
                      {new Date(p.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ Create / Edit Modal ═══ */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formMode === "create" ? "Create Project" : "Edit Project"}
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
            <label className="form-label">Project Name</label>
            <input
              className={`form-input ${formErrors.name ? "form-input--error" : ""}`}
              name="name"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={handleChange}
              disabled={formLoading}
            />
            {formErrors.name && (
              <span className="form-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input mp-textarea"
              name="description"
              placeholder="Brief project description…"
              value={form.description}
              onChange={handleChange}
              disabled={formLoading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              className="form-input"
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              disabled={formLoading}
            />
          </div>

          {formMode === "edit" && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={formLoading}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multi-select members */}
          <div className="form-group">
            <label className="form-label">Assign Members</label>
            <div className="mp-multiselect">
              <button
                type="button"
                className="mp-multiselect__trigger"
                onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
              >
                {form.members.length === 0 ? (
                  <span className="mp-multiselect__placeholder">
                    Select team members…
                  </span>
                ) : (
                  <span className="mp-multiselect__count">
                    {form.members.length} member
                    {form.members.length !== 1 ? "s" : ""} selected
                  </span>
                )}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mp-multiselect__chevron ${memberDropdownOpen ? "mp-multiselect__chevron--open" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {memberDropdownOpen && (
                <div className="mp-multiselect__dropdown">
                  {assignableUsers.length === 0 ? (
                    <div className="mp-multiselect__empty">
                      No users available
                    </div>
                  ) : (
                    assignableUsers.map((u) => (
                      <label
                        key={u._id || u.id}
                        className="mp-multiselect__option"
                      >
                        <input
                          type="checkbox"
                          checked={form.members.includes(u._id || u.id)}
                          onChange={() => toggleMember(u._id || u.id)}
                        />
                        <span className="mp-multiselect__checkbox" />
                        <span className="mp-multiselect__name">{u.name}</span>
                        <span className="mp-multiselect__role">{u.role}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Selected member chips */}
            {form.members.length > 0 && (
              <div className="mp-chips">
                {form.members.map((id) => (
                  <span key={id} className="mp-chip">
                    {getMemberName(id)}
                    <button
                      type="button"
                      onClick={() => toggleMember(id)}
                      className="mp-chip__remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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
                "Create Project"
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
        title="Delete Project"
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
          <h3 className="confirm-dialog__title">Delete this project?</h3>
          <p className="confirm-dialog__desc">
            This will permanently delete{" "}
            <span className="confirm-dialog__name">{deleteTarget?.name}</span>{" "}
            and all its tasks.
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
                "Delete Project"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerProjects;
