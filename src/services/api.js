import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            params: { token: refreshToken },
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
};

// Reports API
export const reportsAPI = {
  list: (params) => api.get('/reports/', { params }),
  get: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports/', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  generatePDF: (id) => api.post(`/reports/${id}/generate-pdf`),
  uploadPhoto: (id, formData) => 
    api.post(`/reports/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadAudio: (id, formData) =>
    api.post(`/reports/${id}/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getTypes: () => api.get('/reports/types'),
  publish: (id) => api.post(`/reports/${id}/publish`),
  getWorkflowStatus: (id) => api.get(`/reports/${id}/workflow-status`),
  deletePhoto: (reportId, photoId) => api.delete(`/reports/${reportId}/photos/${photoId}`),
  generateAI: (id) => api.post(`/reports/${id}/generate-ai`),
  getAIContent: (id) => api.get(`/reports/${id}/ai-content`),
  updateAIContent: (id, sections) => api.put(`/reports/${id}/ai-content`, { sections }),
};

// Chatbot API
export const chatbotAPI = {
  chat: (message, conversationId = null, useRag = true) =>
    api.post('/chatbot/chat', { message, conversation_id: conversationId, use_rag: useRag }),
  listConversations: () => api.get('/chatbot/conversations'),
  getConversation: (id) => api.get(`/chatbot/conversations/${id}`),
  getMessages: (id) => api.get(`/chatbot/conversations/${id}/messages`),
  createConversation: (data) => api.post('/chatbot/conversations', data),
  deleteConversation: (id) => api.delete(`/chatbot/conversations/${id}`),
  getProviders: () => api.get('/chatbot/providers'),
};

// Organizations API
export const organizationsAPI = {
  get: () => api.get('/organizations/me'),
  update: (data) => api.put('/organizations/me', data),
  listUsers: () => api.get('/organizations/me/users'),
  inviteUser: (data) => api.post('/organizations/me/users', data),
  updateUser: (userId, data) => api.put(`/organizations/me/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/organizations/me/users/${userId}`),
  uploadLogo: (formData) =>
    api.post('/organizations/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteLogo: () => api.delete('/organizations/me/logo'),
};

// Knowledge Base API
export const knowledgeAPI = {
  list: (params) => api.get('/knowledge/', { params }),
  get: (id) => api.get(`/knowledge/${id}`),
  create: (data) => api.post('/knowledge/', data),
  update: (id, data) => api.put(`/knowledge/${id}`, data),
  delete: (id) => api.delete(`/knowledge/${id}`),
  upload: (formData, onProgress) =>
    api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  uploadBulk: (formData, onProgress) =>
    api.post('/knowledge/upload-bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  reindex: (id) => api.post(`/knowledge/${id}/reindex`),
  reindexAll: () => api.post('/knowledge/reindex-all'),
};

// Billing API
export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),
  getSubscription: () => api.get('/billing/subscription'),
  subscribe: (planId, billingCycle = 'monthly') =>
    api.post('/billing/subscribe', { plan_id: planId, billing_cycle: billingCycle }),
  cancel: () => api.post('/billing/cancel'),
  listInvoices: () => api.get('/billing/invoices'),
  getPaymentMethods: () => api.get('/billing/payment-methods'),
  addPaymentMethod: (paymentMethodId) =>
    api.post('/billing/payment-methods', { payment_method_id: paymentMethodId }),
  updateSubscription: (planId) => api.put('/billing/subscription', { plan_id: planId }),
  deletePaymentMethod: (id) => api.delete(`/billing/payment-methods/${id}`),
  upgradeToAnnual: () => api.post('/billing/upgrade-to-annual'),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

// URL base del servidor (sin /api/v1) — para media y health
export const ROOT_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

// Helper: convierte rutas relativas de media (/media/...) a URLs absolutas del backend
export const mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${ROOT_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const healthAPI = {
  check: () => axios.get(`${ROOT_URL}/health`, { timeout: 5000 }),
};

export default api;
