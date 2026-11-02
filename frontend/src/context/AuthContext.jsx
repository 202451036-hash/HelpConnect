import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('helpconnect_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('helpconnect_token'));
  const [loading, setLoading] = useState(true);

  // Re-verify token on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response && response.user) {
          setUser(response.user);
          localStorage.setItem('helpconnect_user', JSON.stringify(response.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('helpconnect_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('helpconnect_auth_expired', handleAuthExpired);
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res && res.token && res.user) {
      localStorage.setItem('helpconnect_token', res.token);
      localStorage.setItem('helpconnect_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid response from login server');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    // After registration, log the user in immediately
    if (res && res.user) {
      return login(userData.email, userData.password);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('helpconnect_token');
    localStorage.removeItem('helpconnect_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
