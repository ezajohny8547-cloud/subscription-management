import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sms_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('sms_auth_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.data) {
        const authData = response.data;
        const userData = {
          id: authData.id,
          name: authData.name,
          email: authData.email,
          role: authData.role,
        };
        setUser(userData);
        setToken(authData.token);
        localStorage.setItem('sms_auth_token', authData.token);
        localStorage.setItem('sms_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sms_auth_token');
    localStorage.removeItem('sms_user');
  };

  /**
   * Helper for fast persona testing during reviews:
   * Switches quickly between pre-seeded users
   */
  const switchPersona = async (roleName) => {
    if (roleName === 'ADMIN') {
      await login('admin@subscription.com', 'password123');
    } else if (roleName === 'MANAGER') {
      await login('manager@subscription.com', 'password123');
    } else if (roleName === 'CUSTOMER') {
      await login('john.doe@example.com', 'password123');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER' || user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    loading,
    login,
    logout,
    switchPersona,
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
