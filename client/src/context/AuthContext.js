'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const BACKEND_URL = getBackendUrl();

// Create pre-configured axios instance
export const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Validate token and fetch current profile details
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('[AuthContext] Failed to resume user session:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Route guarding/redirection effects
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
    const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (!user) {
      // Direct unauthorized visitors away from protected pages
      if (isAdminRoute) {
        router.push('/admin/login');
      } else if (isDashboardRoute) {
        router.push('/login');
      }
    } else {
      // Redirect logged-in users away from auth pages
      if (isAuthRoute) {
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }

      // Customer trying to enter Admin deck
      if (pathname.startsWith('/admin') && pathname !== '/admin/login' && user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, pathname, loading, router]);

  const login = async (registrationNumber, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { registrationNumber, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      // Sync cookie for Next.js middleware and API integrations
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
      
      setUser(userData);
      
      if (userData.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication credentials rejected.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  const register = async (name, registrationNumber, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, registrationNumber, password, role });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
      
      setUser(userData);
      
      if (userData.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped within an AuthProvider.');
  }
  return context;
};
