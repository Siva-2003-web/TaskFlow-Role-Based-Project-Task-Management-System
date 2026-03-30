import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getDashboardPath } from '../utils/roleRoutes';
import './Forbidden.css';

const Forbidden = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dashboardPath = isAuthenticated ? getDashboardPath(user?.role) : '/login';

  return (
    <div className="forbidden-page">
      <div className="forbidden-bg-gradient" />
      <div className="forbidden-bg-orb forbidden-bg-orb--1" />
      <div className="forbidden-bg-orb forbidden-bg-orb--2" />

      <div className="forbidden-card animate-fade-in" id="forbidden-card">
        {/* Shield icon */}
        <div className="forbidden-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="9" x2="15" y1="9" y2="15" />
            <line x1="15" x2="9" y1="9" y2="15" />
          </svg>
        </div>

        <div className="forbidden-code">403</div>
        <h1 className="forbidden-title">Access Forbidden</h1>
        <p className="forbidden-desc">
          You don't have permission to access this page.
          <br />
          Contact your administrator if you believe this is an error.
        </p>

        <div className="forbidden-actions">
          <Link to={dashboardPath} className="forbidden-btn forbidden-btn--primary" id="forbidden-go-dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            Go to Dashboard
          </Link>
          <button
            className="forbidden-btn forbidden-btn--ghost"
            onClick={() => window.history.back()}
            id="forbidden-go-back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Go Back
          </button>
        </div>

        {/* Role info badge */}
        {user && (
          <div className="forbidden-role-info">
            <span>Signed in as</span>
            <span className="forbidden-role-badge">
              {user.name} ({user.role})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forbidden;
