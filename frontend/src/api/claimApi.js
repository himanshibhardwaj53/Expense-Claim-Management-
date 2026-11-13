import client from './client';

export const claimApi = {
  getClaims: async (params = {}) => {
    const response = await client.get('/claims', { params });
    return response.data;
  },

  getClaimById: async (id) => {
    const response = await client.get(`/claims/${id}`);
    return response.data;
  },

  createClaim: async (data) => {
    const response = await client.post('/claims', data);
    return response.data;
  },

  updateClaim: async (id, data) => {
    const response = await client.put(`/claims/${id}`, data);
    return response.data;
  },

  deleteClaim: async (id) => {
    const response = await client.delete(`/claims/${id}`);
    return response.data;
  },

  reviewClaim: async (id, { status, comment }) => {
    const response = await client.patch(`/claims/${id}/review`, { status, comment });
    return response.data;
  },

  approveClaim: async (id, comment = '') => {
    const response = await client.post(`/claims/${id}/approve`, { comment });
    return response.data;
  },

  rejectClaim: async (id, comment) => {
    const response = await client.post(`/claims/${id}/reject`, { comment });
    return response.data;
  },

  uploadReceipt: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/claims/${id}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getReceiptBlob: async (id) => {
    const response = await client.get(`/claims/${id}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getAuditLogs: async (id) => {
    const response = await client.get(`/claims/${id}/audit-logs`);
    return response.data;
  },

  exportCsv: async (params = {}) => {
    const response = await client.get('/claims/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
