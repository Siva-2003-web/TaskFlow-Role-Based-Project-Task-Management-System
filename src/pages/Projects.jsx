import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
} from '../store/slices/projectSlice';
import projectService from '../api/projectService';
import './Projects.css';

const Projects = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState('');

  const fetchProjects = useCallback(async () => {
    dispatch(fetchProjectsStart());
    try {
      const { data } = await projectService.getAll();
      dispatch(fetchProjectsSuccess(data.projects || data));
    } catch (err) {
      dispatch(fetchProjectsFailure(err.response?.data?.message || 'Failed to load projects'));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusBadge = (status) => {
    const map = {
      active: 'projects-badge--active',
      completed: 'projects-badge--completed',
      'on-hold': 'projects-badge--hold',
    };
    return (
      <span className={`projects-badge ${map[status] || map.active}`}>
        {status || 'active'}
      </span>
    );
  };

  const isReadOnly = user?.role === 'admin';

  return (
    <div className="projects-page animate-fade-in">
      {/* Header */}
      <div className="projects-header">
        <div>
          <h1 className="projects-header__title">Projects</h1>
          <p className="projects-header__subtitle">
            {isReadOnly ? 'Overview of all projects (read-only)' : 'Manage your team\'s projects'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="projects-toolbar">
        <div className="users-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="users-search__icon">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="users-search__input"
            id="project-search-input"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="users-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
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

      {/* Projects Grid or Empty State */}
      {!loading && filtered.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
            </svg>
          </div>
          <h3 className="users-empty__title">
            {search ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="users-empty__desc">
            {search
              ? 'Try adjusting your search criteria.'
              : 'Projects created by managers will appear here.'}
          </p>
        </div>
      ) : (
        !loading && (
          <div className="projects-grid">
            {filtered.map((project, idx) => (
              <div className="project-card" key={project._id || idx}>
                <div className="project-card__header">
                  <div className="project-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                    </svg>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <h3 className="project-card__name">{project.name}</h3>
                <p className="project-card__desc">
                  {project.description || 'No description provided.'}
                </p>

                <div className="project-card__meta">
                  <div className="project-card__meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                    <span>{project.manager?.name || 'Unassigned'}</span>
                  </div>
                  <div className="project-card__meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                    <span>
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="project-card__progress">
                  <div className="project-card__progress-header">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="project-card__progress-bar">
                    <div
                      className="project-card__progress-fill"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Projects;
