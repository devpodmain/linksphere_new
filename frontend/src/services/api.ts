import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Also export as default for compatibility
export default api;

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try to refresh token for specific endpoints that require authentication
    const protectedEndpoints = ['/profiles/me', '/account', '/support/tickets', '/admin', '/superadmin'];
    const isProtectedEndpoint = protectedEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );

    if (error.response?.status === 401 && !originalRequest._retry && isProtectedEndpoint) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Only redirect to login if we're not already on login/signup pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
