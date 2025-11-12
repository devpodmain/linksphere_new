import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import useDynamicFavicon from '../hooks/useFavicon';
import { API_CONFIG } from '../config/api';
import { fetchMySubscription, type SubscriptionSummary } from '../services/subscriptions';

type UserRole = 'user' | 'admin' | 'super_admin';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_image?: string | null;
  profile_image_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  setProfileImage: (imageUrl: string | null) => void;
  subscription: SubscriptionSummary | null;
  refreshSubscription: () => Promise<void>;
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);

  useDynamicFavicon(profileImage, { fallbackHref: '/default-avatar.png', persist: true });

  useEffect(() => {
    // Don't check auth status if we're on a public profile page
    const isPublicProfile = /^\/(connect|user|u)\//.test(window.location.pathname);
    if (!isPublicProfile) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const convertToAbsoluteImageUrl = (imageUrl?: string | null): string | null => {
    if (!imageUrl) return null;

    let normalizedUrl = imageUrl.trim();
    if (!normalizedUrl) return null;

    if (normalizedUrl.startsWith('uploads/')) {
      normalizedUrl = `/${normalizedUrl}`;
    }

    if (normalizedUrl.startsWith('http')) return normalizedUrl;

    if (normalizedUrl.startsWith('/uploads/profiles/')) {
      const filename = normalizedUrl.split('/').pop();
      return filename ? `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=profiles` : null;
    }
    if (normalizedUrl.startsWith('/uploads/qr/')) {
      const filename = normalizedUrl.split('/').pop();
      return filename ? `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=qr` : null;
    }
    if (normalizedUrl.startsWith('/api/uploads/collaborations/')) {
      const filename = normalizedUrl.split('/').pop();
      return filename ? `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=collaborations` : null;
    }
    if (normalizedUrl.startsWith('/')) {
      return `${API_CONFIG.BASE_URL}${normalizedUrl}`;
    }
    return normalizedUrl;
  };

  const updateProfileImage = (imageUrl: string | null) => {
    setProfileImage(convertToAbsoluteImageUrl(imageUrl));
  };

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/profiles/me');
      if (response.data.success) {
        setUser({
          id: response.data.profile.id,
          name: response.data.profile.name,
          email: response.data.profile.email,
          role: response.data.profile.role ?? 'user'
        });
        const profile = response.data.profile;
        updateProfileImage(
          profile.profile_image_url ??
          profile.profile_image ??
          profile.profile?.profile_image ??
          null
        );
        await loadSubscription();
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await fetchMySubscription();
      if (response.data.success) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.warn('Failed to load subscription details', error);
      setSubscription(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        setUser({
          ...response.data.user,
          role: response.data.user.role ?? 'user'
        });
        updateProfileImage(
          response.data.user?.profile_image_url ??
          response.data.user?.profile_image ??
          response.data.user?.profile?.profile_image ??
          null
        );
        await loadSubscription();
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
        setUser({
          ...response.data.user,
          role: response.data.user.role ?? 'user'
        });
        updateProfileImage(
          response.data.user?.profile_image_url ??
          response.data.user?.profile_image ??
          response.data.user?.profile?.profile_image ??
          null
        );
        await loadSubscription();
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
      setSubscription(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setProfileImage: updateProfileImage,
    subscription,
    refreshSubscription: loadSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
