import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Users from "./pages/Users";
import Forbidden from "./pages/Forbidden";
import ManagerProjects from "./pages/ManagerProjects";
import ManagerTasks from "./pages/ManagerTasks";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeTasks from "./pages/EmployeeTasks";
import EmployeeProjects from "./pages/EmployeeProjects";

/**
 * Helper – wraps a page with ProtectedRoute + AppLayout.
 */
const Protected = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      {/* ═══════ Public Routes ═══════ */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* ═══════ Admin Routes (/admin/*) ═══════ */}
      <Route
        path="/admin/dashboard"
        element={
          <Protected roles={["admin"]}>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Protected roles={["admin"]}>
            <Users />
          </Protected>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <Protected roles={["admin"]}>
            <Projects />
          </Protected>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <Protected roles={["admin"]}>
            <ManagerTasks />
          </Protected>
        }
      />

      {/* ═══════ Manager Routes (/manager/*) ═══════ */}
      <Route
        path="/manager/dashboard"
        element={
          <Protected roles={["manager"]}>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/manager/projects"
        element={
          <Protected roles={["manager"]}>
            <ManagerProjects />
          </Protected>
        }
      />
      <Route
        path="/manager/tasks"
        element={
          <Protected roles={["manager"]}>
            <ManagerTasks />
          </Protected>
        }
      />

      {/* ═══════ Employee Routes (/*) ═══════ */}
      <Route
        path="/dashboard"
        element={
          <Protected roles={["employee"]}>
            <EmployeeDashboard />
          </Protected>
        }
      />
      <Route
        path="/projects"
        element={
          <Protected roles={["employee"]}>
            <EmployeeProjects />
          </Protected>
        }
      />
      <Route
        path="/tasks"
        element={
          <Protected roles={["employee"]}>
            <EmployeeTasks />
          </Protected>
        }
      />

      {/* ═══════ Fallback ═══════ */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
