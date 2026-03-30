import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { getNavItems } from '../utils/roleRoutes';
import authService from '../api/authService';
import './AppLayout.css';

/* ── SVG Icon Map ── */
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

const AppLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed even if API call fails
    }
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  // Get role-specific navigation items
  const navItems = getNavItems(user?.role);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'layout-role--admin';
      case 'manager': return 'layout-role--manager';
      default: return 'layout-role--employee';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      default: return 'Employee';
    }
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="layout-sidebar" id="app-sidebar">
        <div className="layout-sidebar__top">
          {/* Logo */}
          <div className="layout-logo">
            <div className="layout-logo__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="layout-logo__text">TaskFlow</span>
          </div>

          {/* Role label */}
          <div className="layout-role-label">
            <span className={`layout-role-pill ${getRoleBadgeClass(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>

          {/* Navigation — driven by role */}
          <nav className="layout-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `layout-nav__link ${isActive ? 'layout-nav__link--active' : ''}`
                }
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="layout-nav__icon">{icons[item.iconKey]}</span>
                <span className="layout-nav__label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom — user card + logout */}
        <div className="layout-sidebar__bottom">
          <div className="layout-user-card">
            <div className="layout-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="layout-user-info">
              <span className="layout-user-name">{user?.name || 'User'}</span>
              <span className="layout-user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button
            className="layout-logout-btn"
            onClick={handleLogout}
            id="logout-btn"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="layout-main" id="main-content">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
