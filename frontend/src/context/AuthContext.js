import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    const saved = localStorage.getItem('erp_user');

    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
    localStorage.setItem('erp_token', res.data.token);
    localStorage.setItem('erp_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  const hasRole = (...roles) => Boolean(user && roles.includes(user.role));

  const value = useMemo(() => ({ user, loading, login, logout, hasRole }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
