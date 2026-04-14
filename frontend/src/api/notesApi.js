import axios from 'axios';

const api = axios.create({
  baseURL: 'https://markdown-notes-app-umyr.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const unwrap = (response) => response.data.data;

export const notesApi = {
  getAll: () => api.get('/notes').then(unwrap),
  getById: (id) => api.get(`/notes/${id}`).then(unwrap),
  search: (q) => api.get('/notes/search', { params: { q } }).then(unwrap),
  create: (note = {}) =>
    api.post('/notes', { title: 'Untitled Note', content: '', ...note }).then(unwrap),
  update: (id, patch) => api.put(`/notes/${id}`, patch).then(unwrap),
  remove: (id) => api.delete(`/notes/${id}`).then(unwrap),
};