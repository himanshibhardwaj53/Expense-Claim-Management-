import client, { tokenStorage } from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    tokenStorage.setAuth(accessToken, refreshToken, user);
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await client.post('/auth/register', { name, email, password });
    const { accessToken, refreshToken, user } = response.data;
    tokenStorage.setAuth(accessToken, refreshToken, user);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },

  logout: () => {
    tokenStorage.clearAuth();
  },
};
