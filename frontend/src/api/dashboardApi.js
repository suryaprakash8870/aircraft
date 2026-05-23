import axios from './axios';

export const dashboardApi = {
  getStats: () => axios.get('/dashboard/stats'),
  getMonthlyPurchase: () => axios.get('/dashboard/charts/monthly-purchase'),
  getMonthlyConsumption: () => axios.get('/dashboard/charts/monthly-consumption'),
  getVendorAnalytics: () => axios.get('/dashboard/charts/vendor-analytics'),
  getAirportUsage: () => axios.get('/dashboard/charts/airport-usage'),
  getRecentTransactions: () => axios.get('/dashboard/recent-transactions'),
};
