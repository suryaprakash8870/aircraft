import axios from './axios';

export const fuelAgentsApi = {
  getAll: (params) => axios.get('/fuel-agents', { params }),
  getById: (id) => axios.get(`/fuel-agents/${id}`),
  create: (data) => axios.post('/fuel-agents', data),
  update: (id, data) => axios.put(`/fuel-agents/${id}`, data),
  delete: (id) => axios.delete(`/fuel-agents/${id}`),
};
