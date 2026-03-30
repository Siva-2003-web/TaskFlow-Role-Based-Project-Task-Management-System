import { Link } from "react-router-dom";

const Tasks = () => {
  return (
    <div className="et-page animate-fade-in">
      <div className="et-header">
        <h1 className="et-header__title">Tasks Workspace</h1>
        <p className="et-header__sub">
          Your tasks are available in role-specific pages for better focus.
        </p>
      </div>

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
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <h3 className="users-empty__title">Use your task dashboard</h3>
        <p className="users-empty__desc">
          Employee, manager, and admin tasks are organized under dedicated
          routes with filtering, status updates, and team insights.
        </p>
        <Link to="/dashboard" className="btn btn--primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Tasks;
