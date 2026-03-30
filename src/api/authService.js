import API from './axios';

/**
 * Auth API service — all authentication-related HTTP calls.
 * The backend is expected at /api/auth/*.
 */
const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
};

export default authService;
