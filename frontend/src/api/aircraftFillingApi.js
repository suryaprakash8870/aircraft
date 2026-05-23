import axios from './axios';

export const aircraftFillingApi = {
  getAll: (params) => axios.get('/aircraft-filling', { params }),
  getById: (id) => axios.get(`/aircraft-filling/${id}`),
  create: (data) => axios.post('/aircraft-filling', data),
  update: (id, data) => axios.put(`/aircraft-filling/${id}`, data),
  delete: (id) => axios.delete(`/aircraft-filling/${id}`),
  downloadPdf: (id) => axios.get(`/pdf/filling/${id}`, { responseType: 'blob' }),
};
