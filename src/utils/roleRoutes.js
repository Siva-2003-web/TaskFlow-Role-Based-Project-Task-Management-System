/**
 * Returns the dashboard path for a given user role.
 * Admin    → /admin/dashboard
 * Manager  → /manager/dashboard
 * Employee → /dashboard
 */
export const getDashboardPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "manager":
      return "/manager/dashboard";
    default:
      return "/dashboard";
  }
};

/**
 * Returns the base path prefix for a given role.
 */
export const getRolePrefix = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "manager":
      return "/manager";
    default:
      return "";
  }
};

/**
 * Navigation items per role.
 * Each item has { to, label, icon (svg string name) }.
 */
export const getNavItems = (role) => {
  const prefix = getRolePrefix(role);

  const common = [
    { to: `${prefix}/dashboard`, label: "Dashboard", iconKey: "dashboard" },
  ];

  switch (role) {
    case "admin":
      return [
        ...common,
        { to: "/admin/users", label: "Users", iconKey: "users" },
        { to: "/admin/projects", label: "Projects", iconKey: "projects" },
        { to: "/admin/tasks", label: "Tasks", iconKey: "tasks" },
      ];

    case "manager":
      return [
        ...common,
        { to: "/manager/projects", label: "Projects", iconKey: "projects" },
        { to: "/manager/tasks", label: "Tasks", iconKey: "tasks" },
      ];

    // employee (default)
    default:
      return [
        ...common,
        { to: "/projects", label: "My Projects", iconKey: "projects" },
        { to: "/tasks", label: "My Tasks", iconKey: "tasks" },
      ];
  }
};
