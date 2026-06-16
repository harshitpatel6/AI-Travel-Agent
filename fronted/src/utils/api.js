import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, new_password) => api.post('/auth/reset-password', { email, otp, new_password }),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (message, sessionId = null) => 
    api.post('/chat', { message, session_id: sessionId }),
  streamMessage: (message, sessionId = null) => 
    api.post('/chat/stream', { message, session_id: sessionId }),
  getSessions: () => api.get('/sessions'),
  getSessionMessages: (sessionId) => api.get(`/sessions/${sessionId}/messages`),
};

// Booking APIs
export const bookingAPI = {
  getHotelBookings: () => api.get('/bookings/hotels'),
  getFlightBookings: () => api.get('/bookings/flights'),
};

// Profile APIs
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (currentPassword, newPassword) => 
    api.post('/profile/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
};

// Subscription APIs
export const subscriptionAPI = {
  getStatus: () => api.get('/subscription/status'),
  createSubscription: (priceId) => 
    api.post(`/subscription/create?price_id=${priceId}`),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getAnalytics: (period) => api.get(`/admin/analytics?period=${period}`),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getSystemSettings: () => api.get('/admin/system-settings'),
  updateSystemSetting: (key, value, description) => 
    api.put(`/admin/system-settings/${key}?setting_value=${value}&description=${description}`),
  getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
};

// MCP APIs
export const mcpAPI = {
  chat: (message, sessionId) => api.post('/mcp/chat', { message, session_id: sessionId }),
  executeTool: (toolName, parameters) => 
    api.post('/mcp/tools', { tool_name: toolName, parameters }),
};

// Health Check
export const healthCheck = () => api.get('/health');

export default api;
