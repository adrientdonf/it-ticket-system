import axios from 'axios';

// ── Base Axios Instance ───────────────────────────────────────────────────────
// All API calls go through this instance so we only configure it once.
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Attach the JWT token to every request if one exists in localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor ──────────────────────────────────────────────────────
// Only redirect to login if the user HAD a token that is now invalid/expired.
// This prevents a redirect loop when the user is not logged in yet.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(localStorage.getItem('token'));
    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth Endpoints ────────────────────────────────────────────────────────────
export const loginUser    = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const getMe        = ()     => api.get('/auth/me');

// ── Ticket Endpoints ──────────────────────────────────────────────────────────
export const getTickets    = ()         => api.get('/tickets');
export const createTicket  = (data)     => api.post('/tickets', data);
export const updateTicket  = (id, data) => api.put(`/tickets/${id}`, data);
export const deleteTicket  = (id)       => api.delete(`/tickets/${id}`);

export default api;