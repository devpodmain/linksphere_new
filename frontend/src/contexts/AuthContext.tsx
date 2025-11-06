import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't check auth status if we're on a public profile page
    const isPublicProfile = window.location.pathname.startsWith('/u/');
    if (!isPublicProfile) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/profiles/me');
      if (response.data.success) {
        setUser({
          id: response.data.profile.id,
          name: response.data.profile.name,
          email: response.data.profile.email
        });
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        confirm_password: confirmPassword
      });
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
