import API from './axios';

const taskService = {
  getAll: (params) => API.get('/tasks', { params }),
  getByProject: (projectId) => API.get(`/tasks/project/${projectId}`),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (taskData) => API.post('/tasks', taskData),
  update: (id, taskData) => API.put(`/tasks/${id}`, taskData),
  updateStatus: (id, status) => API.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => API.delete(`/tasks/${id}`),
};

export default taskService;
