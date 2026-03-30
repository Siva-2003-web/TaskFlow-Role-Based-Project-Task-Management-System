import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchTasksStart, fetchTasksSuccess, fetchTasksFailure,
} from '../store/slices/taskSlice';
import {
  fetchProjectsStart, fetchProjectsSuccess, fetchProjectsFailure,
} from '../store/slices/projectSlice';
import taskService from '../api/taskService';
import projectService from '../api/projectService';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { tasks, loading } = useSelector((s) => s.tasks);
  const { projects } = useSelector((s) => s.projects);

  const fetchData = useCallback(async () => {
    dispatch(fetchTasksStart());
    try {
      const { data } = await taskService.getAll({ assignee: user?._id });
      dispatch(fetchTasksSuccess(data.tasks || data));
    } catch (err) {
      dispatch(fetchTasksFailure(err.response?.data?.message || 'Failed to load tasks'));
    }
    dispatch(fetchProjectsStart());
    try {
      const { data } = await projectService.getAll();
      dispatch(fetchProjectsSuccess(data.projects || data));
    } catch (err) {
      dispatch(fetchProjectsFailure(err.response?.data?.message || 'Failed to load'));
    }
  }, [dispatch, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derive assigned tasks from the current user
  const myTasks = tasks;
  const stats = {
    total: myTasks.length,
    pending: myTasks.filter((t) => t.status === 'pending').length,
    inProgress: myTasks.filter((t) => t.status === 'in-progress').length,
    completed: myTasks.filter((t) => t.status === 'completed').length,
  };
  const completionPct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Group tasks by project
  const projectMap = {};
  myTasks.forEach((t) => {
    const pid = t.project?._id || t.project || 'unassigned';
    if (!projectMap[pid]) projectMap[pid] = [];
    projectMap[pid].push(t);
  });

  const getProjectName = (pid) => {
    const p = projects.find((p) => p._id === pid);
    return p?.name || 'Unassigned Project';
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="ed-page animate-fade-in">
      {/* Hero greeting */}
      <div className="ed-hero">
        <div className="ed-hero__content">
          <h1 className="ed-hero__title">
            {greeting()}, <span className="ed-hero__name">{user?.name || 'User'}</span> 👋
          </h1>
          <p className="ed-hero__sub">Here's an overview of your assigned work.</p>
        </div>
        <div className="ed-hero__progress-ring" aria-label={`${completionPct}% complete`}>
          <svg viewBox="0 0 80 80" className="ed-ring__svg">
            <circle cx="40" cy="40" r="34" className="ed-ring__bg"/>
            <circle cx="40" cy="40" r="34" className="ed-ring__fill"
              strokeDasharray={`${completionPct * 2.136} ${213.6 - completionPct * 2.136}`}
              strokeDashoffset="53.4"/>
          </svg>
          <div className="ed-ring__label">
            <span className="ed-ring__pct">{completionPct}%</span>
            <span className="ed-ring__text">done</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="ed-stats">
        <div className="ed-stat">
          <div className="ed-stat__icon ed-stat__icon--total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div className="ed-stat__info">
            <span className="ed-stat__val">{stats.total}</span>
            <span className="ed-stat__lbl">Total Tasks</span>
          </div>
        </div>
        <div className="ed-stat">
          <div className="ed-stat__icon ed-stat__icon--pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <div className="ed-stat__info">
            <span className="ed-stat__val">{stats.pending}</span>
            <span className="ed-stat__lbl">Pending</span>
          </div>
        </div>
        <div className="ed-stat">
          <div className="ed-stat__icon ed-stat__icon--progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="ed-stat__info">
            <span className="ed-stat__val">{stats.inProgress}</span>
            <span className="ed-stat__lbl">In Progress</span>
          </div>
        </div>
        <div className="ed-stat">
          <div className="ed-stat__icon ed-stat__icon--done">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="ed-stat__info">
            <span className="ed-stat__val">{stats.completed}</span>
            <span className="ed-stat__lbl">Completed</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && !myTasks.length && (
        <div className="users-loading"><div className="users-loading__spinner"/><span>Loading your projects…</span></div>
      )}

      {/* Assigned Projects */}
      <h2 className="ed-section-title">Assigned Projects</h2>

      {!loading && Object.keys(projectMap).length === 0 ? (
        <div className="users-empty">
          <div className="users-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          </div>
          <h3 className="users-empty__title">No tasks assigned</h3>
          <p className="users-empty__desc">Your manager hasn't assigned any tasks to you yet. Check back later!</p>
        </div>
      ) : !loading && (
        <div className="ed-projects-grid">
          {Object.entries(projectMap).map(([pid, pTasks]) => {
            const pDone = pTasks.filter((t) => t.status === 'completed').length;
            const pPct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
            return (
              <Link to="/tasks" className="ed-project-card" key={pid}>
                <div className="ed-project-card__top">
                  <div className="ed-project-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                  </div>
                  <span className="ed-project-card__count">{pTasks.length} task{pTasks.length !== 1 ? 's' : ''}</span>
                </div>
                <h3 className="ed-project-card__name">{getProjectName(pid)}</h3>
                {/* Mini status breakdown */}
                <div className="ed-project-card__breakdown">
                  <span className="ed-mini-dot ed-mini-dot--pending"/>{pTasks.filter(t => t.status === 'pending').length} pending
                  <span className="ed-mini-dot ed-mini-dot--progress" style={{marginLeft: '0.75rem'}}/>{pTasks.filter(t => t.status === 'in-progress').length} active
                  <span className="ed-mini-dot ed-mini-dot--done" style={{marginLeft: '0.75rem'}}/>{pDone} done
                </div>
                {/* Progress */}
                <div className="ed-project-card__bar-wrap">
                  <div className="ed-project-card__bar"><div className="ed-project-card__bar-fill" style={{ width: `${pPct}%` }}/></div>
                  <span className="ed-project-card__bar-pct">{pPct}%</span>
                </div>
                <span className="ed-project-card__cta">View Tasks →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
