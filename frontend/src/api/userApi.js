import client from './client';

export const userApi = {
  getUsers: async (params = {}) => {
    const response = await client.get('/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await client.get(`/users/${id}`);
    return response.data;
  },

  toggleUserStatus: async (id, active) => {
    const response = await client.patch(`/users/${id}/status`, null, {
      params: { active },
    });
    return response.data;
  },
};
