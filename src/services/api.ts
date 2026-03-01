import axios from 'axios';

const API_URL = 'http://localhost:5583/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
};

export const transcriptions = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/transcriptions'),
  getById: (id: number) => api.get(`/transcriptions/${id}`),
  delete: (id: number) => api.delete(`/transcriptions/${id}`),
};

export default api;
