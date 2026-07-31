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

export const fetchObservations = (page = 1, pageSize = 50, filters = {}) =>
  api.get('/observations', { params: { page, pageSize, ...filters } }).then(r => r.data);

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

// Streaming AI batch classify — yields NDJSON events
export async function* classifyBatchStream(data) {
  const response = await fetch('/api/ai/classify-batch/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed);
      } catch {
        // skip
      }
    }
  }

  if (buffer.trim()) {
    try { yield JSON.parse(buffer.trim()); } catch {}
  }
}

export const aiPause = () =>
  api.post('/ai/classify-batch/pause').then(r => r.data);

export const aiResume = () =>
  api.post('/ai/classify-batch/resume').then(r => r.data);

export const aiCancel = () =>
  api.post('/ai/classify-batch/cancel').then(r => r.data);

export const aiStatus = () =>
  api.get('/ai/classify-batch/status').then(r => r.data);

export const uploadExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/excel', formData).then(r => r.data);
};

// Streaming upload — yields NDJSON events as they arrive
export async function* uploadExcelStream(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/excel', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed);
      } catch {
        // skip malformed lines
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim());
    } catch {
      // skip
    }
  }
}

export default api;
