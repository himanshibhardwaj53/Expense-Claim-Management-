import client from './client';

export const dashboardApi = {
  getEmployeeDashboard: async () => {
    const response = await client.get('/dashboard/employee');
    return response.data;
  },

  getManagerDashboard: async () => {
    const response = await client.get('/dashboard/manager');
    return response.data;
  },
};
