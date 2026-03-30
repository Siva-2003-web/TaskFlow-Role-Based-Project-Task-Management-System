import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
} from "../store/slices/projectSlice";
import {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
} from "../store/slices/userSlice";
import {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
} from "../store/slices/taskSlice";
import projectService from "../api/projectService";
import userService from "../api/userService";
import taskService from "../api/taskService";
import "./Dashboard.css";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading: projectsLoading } = useSelector(
    (state) => state.projects,
  );
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { tasks, loading: tasksLoading } = useSelector((state) => state.tasks);

  const fetchDashboardData = useCallback(async () => {
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

    // Fetch users (for admin only)
    if (user?.role === "admin") {
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
    }

    // Fetch tasks
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
  }, [dispatch, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate stats
  const userStats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    managers: users.filter((u) => u.role === "manager").length,
    employees: users.filter((u) => u.role === "employee").length,
  };

  const projectStats = {
    total: projects.length,
  };

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">
            {greeting()},{" "}
            <span className="dashboard-header__name">
              {user?.name || "User"}
            </span>{" "}
            👋
          </h1>
          <p className="dashboard-header__subtitle">
            {user?.role === "admin"
              ? "System overview and administration."
              : "Here's what's happening with your projects today."}
          </p>
        </div>
      </div>

      {/* Admin Stats Grid */}
      {user?.role === "admin" && (
        <div className="dashboard-section">
          <h2 className="dashboard-section__title">System Overview</h2>

          {/* User Stats */}
          <div className="dashboard-subsection">
            <h3 className="dashboard-subsection__title">Users</h3>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-card__icon stat-card__icon--blue">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__value">{userStats.total}</span>
                  <span className="stat-card__label">Total Users</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__icon stat-card__icon--purple">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <path d="M12 1v6m0 6v6" />
                  </svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__value">{userStats.admins}</span>
                  <span className="stat-card__label">Admins</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__icon stat-card__icon--amber">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 15H7a4 4 0 0 0-4 4v2h4m0-6a4 4 0 0 1 4-4h4m0 0a4 4 0 0 1 4 4v2h-4m0-6a4 4 0 1 0-8 0" />
                  </svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__value">{userStats.managers}</span>
                  <span className="stat-card__label">Managers</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card__icon stat-card__icon--green">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__value">
                    {userStats.employees}
                  </span>
                  <span className="stat-card__label">Employees</span>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Stats */}
          <div className="dashboard-subsection">
            <h3 className="dashboard-subsection__title">Projects</h3>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-card__icon stat-card__icon--blue">
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
                <div className="stat-card__info">
                  <span className="stat-card__value">{projectStats.total}</span>
                  <span className="stat-card__label">Total Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-admin view (Manager/Employee) */}
      {user?.role !== "admin" && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--blue">
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
            <div className="stat-card__info">
              <span className="stat-card__value">{projectStats.total}</span>
              <span className="stat-card__label">Projects</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--purple">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{taskStats.total}</span>
              <span className="stat-card__label">Total Tasks</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--amber">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{taskStats.inProgress}</span>
              <span className="stat-card__label">In Progress</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--green">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{taskStats.completed}</span>
              <span className="stat-card__label">Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {user?.role === "admin" &&
        userStats.total === 0 &&
        projectStats.total === 0 && (
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <h2 className="dashboard-empty__title">
              Welcome to TaskFlow Admin
            </h2>
            <p className="dashboard-empty__desc">
              Start by creating users and projects. Use the sidebar navigation
              to manage system resources.
            </p>
          </div>
        )}
    </div>
  );
};

export default Dashboard;
