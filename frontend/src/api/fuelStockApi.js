import axios from './axios';

export const fuelStockApi = {
  getAll: () => axios.get('/fuel-stock'),
  getByAirport: (airportId) => axios.get(`/fuel-stock/airport/${airportId}`),
  adjustment: (data) => axios.post('/fuel-stock/adjustment', data),
  getLogs: (params) => axios.get('/fuel-stock/logs', { params }),
};
