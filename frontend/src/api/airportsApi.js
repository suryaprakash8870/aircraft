import axios from './axios';

export const airportsApi = {
  getAll: (params) => axios.get('/airports', { params }),
  getById: (id) => axios.get(`/airports/${id}`),
  create: (data) => axios.post('/airports', data),
  update: (id, data) => axios.put(`/airports/${id}`, data),
  delete: (id) => axios.delete(`/airports/${id}`),
};
