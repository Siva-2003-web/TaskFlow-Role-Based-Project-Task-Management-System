import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──
API.interceptors.request.use(
  (config) => {
    // Cookies are sent automatically via withCredentials.
    // If you later switch to token-based auth, attach the token here:
    // const token = store.getState().auth.token;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Redirect to login on 401 Unauthorized
      if (status === 401) {
        window.location.href = '/login';
      }

      // Surface a friendly message for 500s
      if (status >= 500) {
        console.error('[API] Server error:', error.response.data);
      }
    }
    return Promise.reject(error);
  },
);

export default API;
