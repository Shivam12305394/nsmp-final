import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nsmp_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount — re-fetch fresh user data
  useEffect(() => {
    const token = localStorage.getItem('nsmp_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('nsmp_user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('nsmp_token');
        localStorage.removeItem('nsmp_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // login: called by Login page after successful API call — just syncs state
  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('nsmp_token', token);
    localStorage.setItem('nsmp_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  // register: legacy direct register (no OTP)
  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { token, user: userData } = res.data;
    localStorage.setItem('nsmp_token', token);
    localStorage.setItem('nsmp_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nsmp_token');
    localStorage.removeItem('nsmp_user');
    setUser(null);
  }, []);

  // updateUser: used by Login/Register/OTP pages to set user without re-calling API
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('nsmp_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
