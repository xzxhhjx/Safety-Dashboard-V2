import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Store token in localStorage
let token = localStorage.getItem('admin_token');
export function setToken(t) { token = t; localStorage.setItem('admin_token', t || ''); }
export function getToken() { return token; }

// Attach token to requests
api.interceptors.request.use(config => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      setToken('');
      if (window.location.pathname === '/admin') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(err);
  }
);

// Dashboard APIs (public)
export const fetchStats = (filters = {}) =>
  api.get('/observations/stats', { params: filters }).then(r => r.data);

export const fetchObservations = (page = 1, filters = {}) =>
  api.get('/observations', { params: { page, pageSize: 50, ...filters } }).then(r => r.data);

export const fetchObservationById = (id) =>
  api.get(`/observations/${id}`).then(r => r.data);

export const fetchAwards = () =>
  api.get('/awards').then(r => r.data.data);

// Feedback (public)
export const submitFeedback = (data) =>
  api.post('/feedback', data).then(r => r.data);

// Admin APIs (JWT required)
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data);

export const batchInsertObservations = (records) =>
  api.post('/observations', records).then(r => r.data);

export const updateAwards = (awards) =>
  api.put('/awards', awards).then(r => r.data);

export const classifySingle = (data) =>
  api.post('/ai/classify', data).then(r => r.data);

export const classifyBatch = (data) =>
  api.post('/ai/classify-batch', data).then(r => r.data);

export const uploadExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/excel', formData).then(r => r.data);
};

export default api;
