import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorage, setLogoutListener } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    tokenStorage.clearAuth();
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    // Register auto-logout trigger from Axios refresh interceptor
    setLogoutListener(() => {
      logout();
    });

    // Restore session on mount
    const savedToken = tokenStorage.getAccessToken();
    const savedUser = tokenStorage.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      // Verify token in background
      authApi
        .getCurrentUser()
        .then((freshUser) => {
          setUser(freshUser);
          tokenStorage.setAuth(savedToken, tokenStorage.getRefreshToken(), freshUser);
        })
        .catch(() => {
          // Token invalid or deactivated
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setToken(data.accessToken);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    setUser(data.user);
    setToken(data.accessToken);
    return data.user;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isManager: user?.role === 'ROLE_MANAGER',
    isEmployee: user?.role === 'ROLE_EMPLOYEE',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
