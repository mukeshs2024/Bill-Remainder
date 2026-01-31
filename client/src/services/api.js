/**
 * API Service
 * Axios instance with authentication and request/response interceptors
 */

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token added to request headers');
    } else {
      console.log('[API] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and refresh token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized - clearing auth');
      // Token expired or invalid - clear auth
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS
// ============================================

export const authAPI = {
  register: (username, email, password, firstName, lastName) =>
    api.post('/auth/register', { username, email, password, firstName, lastName }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getCurrentUser: () =>
    api.get('/auth/me'),

  updateProfile: (data) =>
    api.put('/auth/profile', data),

  changePassword: (currentPassword, newPassword, confirmPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword, confirmPassword })
};

// ============================================
// SUBSCRIPTION API CALLS
// ============================================

export const subscriptionAPI = {
  getAll: (isActive) =>
    api.get('/subscriptions', { params: { isActive } }),

  getById: (id) =>
    api.get(`/subscriptions/${id}`),

  getUpcoming: (days = 7) =>
    api.get('/subscriptions/upcoming', { params: { days } }),

  getOverdue: () =>
    api.get('/subscriptions/overdue'),

  create: (data) =>
    api.post('/subscriptions', data),

  update: (id, data) =>
    api.put(`/subscriptions/${id}`, data),

  markAsPaid: (id) =>
    api.put(`/subscriptions/${id}/mark-paid`),

  delete: (id) =>
    api.delete(`/subscriptions/${id}`)
};

// ============================================
// DASHBOARD API CALLS
// ============================================

export const dashboardAPI = {
  getStats: () =>
    api.get('/dashboard/stats'),

  getSpendingByCategory: () =>
    api.get('/dashboard/category-breakdown')
};

export default api;
