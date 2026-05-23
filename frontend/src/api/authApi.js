import axios from './axios';

export const authApi = {
  login: (credentials) => axios.post('/auth/login', credentials),
  refresh: (refreshToken) => axios.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => axios.post('/auth/logout'),
  getMe: () => axios.get('/auth/me'),
};
