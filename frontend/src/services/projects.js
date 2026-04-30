import { api } from '../lib/api';

export const projectsService = {
  list: () => api('/projects'),
  get: (id) => api(`/projects/${id}`),
  create: (payload) => api('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => api(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => api(`/projects/${id}`, { method: 'DELETE' }),
};

export const tasksService = {
  list: (projectId) => api(`/projects/${projectId}/tasks`),
  create: (projectId, payload) => api(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(payload) }),
  update: (projectId, taskId, payload) => api(`/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (projectId, taskId) => api(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }),
};

export const docService = {
  get: (projectId) => api(`/projects/${projectId}/doc`),
  save: (projectId, content) => api(`/projects/${projectId}/doc`, { method: 'PUT', body: JSON.stringify({ content }) }),
};

export const assetsService = {
  list: (projectId) => api(`/projects/${projectId}/assets`),
  create: (projectId, payload) => api(`/projects/${projectId}/assets`, { method: 'POST', body: JSON.stringify(payload) }),
  remove: (projectId, assetId) => api(`/projects/${projectId}/assets/${assetId}`, { method: 'DELETE' }),
};

export const commentsService = {
  list: (projectId) => api(`/projects/${projectId}/comments`),
  create: (projectId, payload) => api(`/projects/${projectId}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  remove: (projectId, commentId) => api(`/projects/${projectId}/comments/${commentId}`, { method: 'DELETE' }),
};
