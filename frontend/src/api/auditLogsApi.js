import axios from './axios';

export const auditLogsApi = {
  getAll: (params) => axios.get('/audit-logs', { params }),
  getById: (id) => axios.get(`/audit-logs/${id}`),
  getByUser: (userId, params) => axios.get(`/audit-logs/user/${userId}`, { params }),
  getByEntity: (entityType, entityId) =>
    axios.get(`/audit-logs/entity/${entityType}/${entityId}`),
};
