import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test API
export const testAPI = {
  createTest: (formData) => api.post('/tests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllTests: () => api.get('/tests'),
  getLiveTests: () => api.get('/tests/live'),
  getTestById: (id) => api.get(`/tests/${id}`),
  updateTest: (id, formData) => api.put(`/tests/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
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