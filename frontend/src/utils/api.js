import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nsmp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — skip redirect for /auth routes to avoid loops
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('nsmp_token');
        localStorage.removeItem('nsmp_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── API HELPERS ──
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

export const scholarshipAPI = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
  getMatches: () => api.get('/scholarships/match/me'),
  getStrategy: (data) => api.post('/ai/strategy', data),
  create: (data) => api.post('/scholarships', data),
  update: (id, data) => api.put(`/scholarships/${id}`, data),
  delete: (id) => api.delete(`/scholarships/${id}`),
};

export const applicationAPI = {
  getMy: () => api.get('/applications/my'),
  getAll: (params) => api.get('/applications', { params }),
  apply: (scholarshipId) => api.post('/applications', { scholarshipId }),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getAnalytics: () => api.get('/users/analytics'),
  getNotifications: () => api.get('/users/notifications'),
  markRead: (id) => api.patch(`/users/notifications/${id}/read`),
  markAllRead: () => api.patch('/users/notifications/read-all'),
};
