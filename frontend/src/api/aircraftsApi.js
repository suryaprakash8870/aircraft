import axios from './axios';

export const aircraftsApi = {
  getAll: (params) => axios.get('/aircrafts', { params }),
  getById: (id) => axios.get(`/aircrafts/${id}`),
  create: (data) => axios.post('/aircrafts', data),
  update: (id, data) => axios.put(`/aircrafts/${id}`, data),
  delete: (id) => axios.delete(`/aircrafts/${id}`),
};
