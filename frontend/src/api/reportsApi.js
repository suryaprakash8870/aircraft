import axios from './axios';

export const reportsApi = {
  getFuelPurchases: (params) => axios.get('/reports/fuel-purchases', { params }),
  getFuelConsumption: (params) => axios.get('/reports/fuel-consumption', { params }),
  getAirportStock: (params) => axios.get('/reports/airport-stock', { params }),
  getAircraftHistory: (params) => axios.get('/reports/aircraft-history', { params }),
  getVendorReport: (params) => axios.get('/reports/vendor', { params }),
  exportReport: (params) => axios.get('/reports/export', { params, responseType: 'blob' }),
  downloadStockPdf: () => axios.get('/pdf/stock-report', { responseType: 'blob' }),
  downloadAnalyticsPdf: (params) => axios.get('/pdf/analytics', { params, responseType: 'blob' }),
};
