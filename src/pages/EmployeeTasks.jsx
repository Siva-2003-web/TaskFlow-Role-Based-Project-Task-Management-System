import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTasksStart, fetchTasksSuccess, fetchTasksFailure,
  updateTask,
} from '../store/slices/taskSlice';
import {
  fetchProjectsStart, fetchProjectsSuccess,
} from '../store/slices/projectSlice';
import taskService from '../api/taskService';
import projectService from '../api/projectService';
import './EmployeeTasks.css';

const STATUS_FLOW = ['pending', 'in-progress', 'review', 'completed'];
const STATUS_LABELS = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  review: 'Review',
  completed: 'Completed',
};

const EmployeeTasks = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { tasks, loading, error } = useSelector((s) => s.tasks);
  const { projects } = useSelector((s) => s.projects);

  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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
    } catch { /* silent */ }
  }, [dispatch, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filters
  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchProject = projectFilter === 'all' || (t.project?._id || t.project) === projectFilter;
    return matchSearch && matchStatus && matchProject;
  });

  // Group by project
  const grouped = {};
  filtered.forEach((t) => {
    const pid = t.project?._id || t.project || 'unassigned';
    if (!grouped[pid]) grouped[pid] = [];
    grouped[pid].push(t);
  });

  const getProjectName = (pid) => projects.find((p) => p._id === pid)?.name || 'Unassigned Project';

  // Status update
  const handleStatusChange = async (task, newStatus) => {
    setUpdatingId(task._id);
    try {
      await taskService.updateStatus(task._id, newStatus);
      dispatch(updateTask({ ...task, status: newStatus }));
    } catch {
      // optimistic update even if API fails (no backend)
      dispatch(updateTask({ ...task, status: newStatus }));
    }
    setTimeout(() => setUpdatingId(null), 400);
  };

  // Next status helper
  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const statusDotClass = (s) => {
    const map = { pending: 'et-dot--pending', 'in-progress': 'et-dot--progress', review: 'et-dot--review', completed: 'et-dot--completed' };
    return `et-dot ${map[s] || map.pending}`;
  };

  const priorityBadge = (p) => (
    <span className={`mt-priority mt-priority--${p || 'medium'}`}>{p || 'medium'}</span>
  );

  return (
    <div className="et-page animate-fade-in">
      {/* Header */}
      <div className="et-header">
        <div>
          <h1 className="et-header__title">My Tasks</h1>
          <p className="et-header__sub">View and update your assigned tasks</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="et-quick-stats">
        <div className="et-qs"><span className="et-qs__val">{stats.total}</span><span className="et-qs__lbl">Total</span></div>
        <div className="et-qs et-qs--pending"><span className="et-qs__val">{stats.pending}</span><span className="et-qs__lbl">Pending</span></div>
        <div className="et-qs et-qs--progress"><span className="et-qs__val">{stats.inProgress}</span><span className="et-qs__lbl">In Progress</span></div>
        <div className="et-qs et-qs--done"><span className="et-qs__val">{stats.completed}</span><span className="et-qs__lbl">Completed</span></div>
      </div>

      {/* Toolbar */}
      <div className="et-toolbar">
        <div className="users-search" style={{ flex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="users-search__icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="users-search__input" id="et-search"/>
        </div>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="form-select users-filter-select" id="et-project-filter">
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select users-filter-select" id="et-status-filter">
          <option value="all">All Status</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && <div className="users-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg><span>{error}</span></div>}

      {/* Loading */}
      {loading && !tasks.length && <div className="users-loading"><div className="users-loading__spinner"/><span>Loading tasks…</span></div>}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="users-empty">
          <div className="users-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h3 className="users-empty__title">{search || statusFilter !== 'all' || projectFilter !== 'all' ? 'No matching tasks' : 'No tasks assigned'}</h3>
          <p className="users-empty__desc">{search || statusFilter !== 'all' || projectFilter !== 'all' ? 'Try adjusting your filters.' : 'Your manager hasn\'t assigned any tasks yet. Check back later!'}</p>
        </div>
      )}

      {/* Grouped task cards */}
      {!loading && Object.keys(grouped).length > 0 && (
        <div className="et-groups">
          {Object.entries(grouped).map(([pid, pTasks]) => (
            <div className="et-group" key={pid}>
              <div className="et-group__header">
                <div className="et-group__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                </div>
                <h3 className="et-group__name">{getProjectName(pid)}</h3>
                <span className="et-group__count">{pTasks.length} task{pTasks.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="et-task-list">
                {pTasks.map((t, idx) => {
                  const next = getNextStatus(t.status);
                  const isUpdating = updatingId === t._id;
                  return (
                    <div className={`et-task ${isUpdating ? 'et-task--updating' : ''}`} key={t._id || idx}>
                      <div className="et-task__left">
                        <span className={statusDotClass(t.status)}/>
                        <div className="et-task__info">
                          <h4 className="et-task__title">{t.title}</h4>
                          {t.description && <p className="et-task__desc">{t.description}</p>}
                        </div>
                      </div>
                      <div className="et-task__right">
                        {priorityBadge(t.priority)}

                        {/* Status dropdown */}
                        <select
                          className={`et-status-select et-status-select--${t.status}`}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                          disabled={isUpdating}
                          id={`status-${t._id || idx}`}
                        >
                          {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>

                        {/* Quick advance button */}
                        {next && (
                          <button
                            className="et-advance-btn"
                            onClick={() => handleStatusChange(t, next)}
                            disabled={isUpdating}
                            title={`Move to ${STATUS_LABELS[next]}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                        )}
                        {t.status === 'completed' && (
                          <span className="et-done-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks;
