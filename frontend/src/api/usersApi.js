import axios from './axios';

export const usersApi = {
  getAll: (params) => axios.get('/users', { params }),
  getById: (id) => axios.get(`/users/${id}`),
  create: (data) => axios.post('/users', data),
  update: (id, data) => axios.put(`/users/${id}`, data),
  delete: (id) => axios.delete(`/users/${id}`),
  changePassword: (id, data) => axios.put(`/users/${id}/change-password`, data),
};
