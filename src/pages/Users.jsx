import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  addUser,
  updateUser,
  removeUser,
} from "../store/slices/userSlice";
import userService from "../api/userService";
import Modal from "../components/Modal";
import "./Users.css";

const EMPTY_FORM = { name: "", email: "", password: "", role: "employee" };
const getUserId = (user) => user?._id || user?.id;

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users on mount
  const fetchUsers = useCallback(async () => {
    dispatch(fetchUsersStart());
    try {
      const { data } = await userService.getAll();
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
    fetchUsers();
  }, [fetchUsers]);

  // ── Filtering ──
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ── Form validation ──
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email format";
    }
    if (formMode === "create" && !form.password) {
      errors.password = "Password is required";
    } else if (form.password && form.password.length < 6) {
      errors.password = "Min 6 characters";
    }
    if (!form.role) errors.role = "Role is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Open create modal ──
  const openCreate = () => {
    setFormMode("create");
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingUserId(null);
    setShowForm(true);
  };

  // ── Open edit modal ──
  const openEdit = (user) => {
    setFormMode("edit");
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormErrors({});
    setEditingUserId(getUserId(user));
    setShowForm(true);
  };

  // ── Submit create / edit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        const { data } = await userService.create(form);
        dispatch(addUser(data.user || data));
      } else {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        const { data } = await userService.update(editingUserId, payload);
        dispatch(updateUser(data.user || data));
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

  // ── Delete ──
  const openDelete = (user) => {
    setDeleteTarget(user);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const userId = getUserId(deleteTarget);
      await userService.delete(userId);
      dispatch(removeUser(userId));
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Role badge ──
  const roleBadge = (role) => {
    const cls = {
      admin: "users-badge--admin",
      manager: "users-badge--manager",
      employee: "users-badge--employee",
    };
    return (
      <span className={`users-badge ${cls[role] || cls.employee}`}>{role}</span>
    );
  };

  // ── Stats ──
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    managers: users.filter((u) => u.role === "manager").length,
    employees: users.filter((u) => u.role === "employee").length,
  };

  return (
    <div className="users-page animate-fade-in">
      {/* Page Header */}
      <div className="users-header">
        <div>
          <h1 className="users-header__title">User Management</h1>
          <p className="users-header__subtitle">
            Manage all user accounts and their roles
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={openCreate}
          id="create-user-btn"
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
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="users-stats">
        <div className="users-stat">
          <span className="users-stat__value">{stats.total}</span>
          <span className="users-stat__label">Total Users</span>
        </div>
        <div className="users-stat users-stat--admin">
          <span className="users-stat__value">{stats.admins}</span>
          <span className="users-stat__label">Admins</span>
        </div>
        <div className="users-stat users-stat--manager">
          <span className="users-stat__value">{stats.managers}</span>
          <span className="users-stat__label">Managers</span>
        </div>
        <div className="users-stat users-stat--employee">
          <span className="users-stat__value">{stats.employees}</span>
          <span className="users-stat__label">Employees</span>
        </div>
      </div>

      {/* Toolbar: search + role filter */}
      <div className="users-toolbar">
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
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="users-search__input"
            id="user-search-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="form-select users-filter-select"
          id="user-role-filter"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
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
      {loading && !users.length && (
        <div className="users-loading">
          <div className="users-loading__spinner" />
          <span>Loading users…</span>
        </div>
      )}

      {/* Table or Empty State */}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="users-empty__title">
            {search || roleFilter !== "all"
              ? "No matching users"
              : "No users found"}
          </h3>
          <p className="users-empty__desc">
            {search || roleFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first user account."}
          </p>
          {!search && roleFilter === "all" && (
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
              Add First User
            </button>
          )}
        </div>
      ) : (
        !loading && (
          <div className="users-table-wrap">
            <table className="users-table" id="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th className="users-table__actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => (
                  <tr key={getUserId(user) || idx} className="users-table__row">
                    <td>
                      <div className="users-table__user">
                        <div className="users-table__avatar">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="users-table__name">{user.name}</span>
                      </div>
                    </td>
                    <td className="users-table__email">{user.email}</td>
                    <td>{roleBadge(user.role)}</td>
                    <td className="users-table__date">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      <div className="users-table__actions">
                        <button
                          className="users-action-btn users-action-btn--edit"
                          title="Edit user"
                          onClick={() => openEdit(user)}
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
                          title="Delete user"
                          onClick={() => openDelete(user)}
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
        )
      )}

      {/* ═══ Create / Edit Modal ═══ */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formMode === "create" ? "Create New User" : "Edit User"}
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
            <label className="form-label">Full Name</label>
            <input
              className={`form-input ${formErrors.name ? "form-input--error" : ""}`}
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleFormChange}
              disabled={formLoading}
            />
            {formErrors.name && (
              <span className="form-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className={`form-input ${formErrors.email ? "form-input--error" : ""}`}
              type="email"
              name="email"
              placeholder="user@company.com"
              value={form.email}
              onChange={handleFormChange}
              disabled={formLoading}
            />
            {formErrors.email && (
              <span className="form-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              {formMode === "create"
                ? "Password"
                : "New Password (leave blank to keep)"}
            </label>
            <input
              className={`form-input ${formErrors.password ? "form-input--error" : ""}`}
              type="password"
              name="password"
              placeholder={
                formMode === "create" ? "Min. 6 characters" : "••••••••"
              }
              value={form.password}
              onChange={handleFormChange}
              disabled={formLoading}
            />
            {formErrors.password && (
              <span className="form-error">{formErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className={`form-select ${formErrors.role ? "form-input--error" : ""}`}
              name="role"
              value={form.role}
              onChange={handleFormChange}
              disabled={formLoading}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {formErrors.role && (
              <span className="form-error">{formErrors.role}</span>
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
                "Create User"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══ Delete Confirmation Modal ═══ */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete User"
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
          <h3 className="confirm-dialog__title">Are you sure?</h3>
          <p className="confirm-dialog__desc">
            This will permanently delete{" "}
            <span className="confirm-dialog__name">{deleteTarget?.name}</span>.
            This action cannot be undone.
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
                "Delete User"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
