import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for large uploads
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timed out. Please check your internet connection and try again.';
    } else if (error.code === 'ERR_NETWORK') {
      error.userMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.response?.status === 503) {
      error.userMessage = error.response.data?.message || 'Service temporarily unavailable. Please try again in a moment.';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'Server error. Please try again later.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'Resource not found.';
    } else if (error.response?.status >= 400) {
      error.userMessage = error.response.data?.message || 'Request failed. Please check your input and try again.';
    } else {
      error.userMessage = 'An unexpected error occurred. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// Test API
export const testAPI = {
  createTest: (formData, onUploadProgress) => api.post('/tests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }),
  saveDraft: (formData, onUploadProgress) => api.post('/tests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }),
  getAllTests: () => api.get('/tests'),
  getLiveTests: () => api.get('/tests/live'),
  getTestById: (id) => api.get(`/tests/${id}`),
  updateTest: (id, formData, onUploadProgress) => api.put(`/tests/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }),
  toggleTestLive: (id, isLive) => api.patch(`/tests/${id}/toggle-live`, { isLive }),
  deleteTest: (id) => api.delete(`/tests/${id}`),
};

// Attempt API
export const attemptAPI = {
  startTest: (data) => api.post('/attempts/start', data),
  syncAnswers: (data) => api.post('/attempts/sync', data),
  submitTest: (data) => api.post('/attempts/submit', data),
  updateWarning: (data) => api.post('/attempts/warning', data),
  getAttempt: (id) => api.get(`/attempts/${id}`),
  getUserAttempts: (candidateName) => api.get(`/attempts/user/${candidateName}`),
  requestResume: (data) => api.post('/attempts/request-resume', data),
  allowResume: (data) => api.post('/attempts/allow-resume', data),
  getResumeRequests: () => api.get('/attempts/resume-requests')
};

export default api;