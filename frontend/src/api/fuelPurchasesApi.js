import axios from './axios';

export const fuelPurchasesApi = {
  getAll: (params) => axios.get('/fuel-purchases', { params }),
  getById: (id) => axios.get(`/fuel-purchases/${id}`),
  create: (data) => axios.post('/fuel-purchases', data),
  update: (id, data) => axios.put(`/fuel-purchases/${id}`, data),
  delete: (id) => axios.delete(`/fuel-purchases/${id}`),
  uploadInvoice: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`/fuel-purchases/${id}/upload-invoice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadPdf: (id) => axios.get(`/pdf/purchase/${id}`, { responseType: 'blob' }),
};
