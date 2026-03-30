import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute — guards routes that require authentication.
 * Optionally restricts access to specific roles.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>                        ← any logged-in user
 *   <Route element={<ProtectedRoute roles={['admin']} />}>      ← admin only
 *   <Route element={<ProtectedRoute roles={['admin','manager']} />}>
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access check → redirect to /forbidden
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default ProtectedRoute;
