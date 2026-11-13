import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const tokenStorage = {
  getAccessToken: () => {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  },
  getRefreshToken: () => {
    try {
      return localStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  },
  getUser: () => {
    try {
      const u = localStorage.getItem('user_data');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setAuth: (accessToken, refreshToken, user) => {
    try {
      if (accessToken) localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      if (user) localStorage.setItem('user_data', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save tokens to storage', e);
    }
  },
  clearAuth: () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    } catch (e) {
      console.error('Failed to clear tokens', e);
    }
  },
};

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let logoutListener = null;
export const setLogoutListener = (fn) => {
  logoutListener = fn;
};

// Requirement 15: Request interceptor to attach access token
client.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Requirement 15: Response interceptor to refresh automatically, log out if refresh fails
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response (network error) or error already retried
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh');

    if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        isRefreshing = false;
        tokenStorage.clearAuth();
        if (logoutListener) logoutListener();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken || refreshToken;

        tokenStorage.setAuth(newAccessToken, newRefreshToken, data.user);
        client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearAuth();
        if (logoutListener) logoutListener();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
