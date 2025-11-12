import { api } from './api';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionPeriod,
  SubscriptionUpdatePayload,
  SubscriptionHistoryEntry,
} from './subscriptions';

export interface SuperAdminStatsResponse {
  success: boolean;
  data: {
    total_users: number;
    active_subscriptions: number;
    estimated_monthly_revenue: number;
  };
}

export interface SuperAdminUserListParams {
  search?: string;
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'disabled';
  plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  page?: number;
  per_page?: number;
}

export interface SuperAdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'disabled';
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_period: SubscriptionPeriod | null;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
  history: SubscriptionHistoryEntry[];
}

export interface SuperAdminUserResponse {
  success: boolean;
  data: SuperAdminUser[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface PromoteAdminPayload {
  user_id?: number;
  name?: string;
  email?: string;
  password?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserStatusPayload {
  status?: 'active' | 'disabled';
  role?: 'user' | 'admin' | 'super_admin';
}

export interface SystemConfigResponse {
  success: boolean;
  config: Record<string, string>;
}

export const fetchSuperAdminStats = () =>
  api.get<SuperAdminStatsResponse>('/superadmin/stats');

export const fetchSuperAdminUsers = (params?: SuperAdminUserListParams) =>
  api.get<SuperAdminUserResponse>('/superadmin/users', { params });

export const fetchSuperAdminSubscriptions = (params?: SuperAdminUserListParams) =>
  api.get<SuperAdminUserResponse>('/superadmin/subscriptions', { params });

export const createOrPromoteAdmin = (payload: PromoteAdminPayload) =>
  api.post('/superadmin/admins', payload);

export const createUserAccount = (payload: CreateUserPayload) =>
  api.post('/superadmin/users/create', payload);

export const updateSuperAdminUserStatus = (id: number, payload: UpdateUserStatusPayload) =>
  api.put(`/superadmin/users/${id}/status`, payload);

export const fetchSystemConfig = () =>
  api.get<SystemConfigResponse>('/superadmin/config');

export const updateSystemConfig = (config: Record<string, string | number>) =>
  api.put('/superadmin/config', config);

export const updateUserSubscription = (userId: number, payload: SubscriptionUpdatePayload) =>
  api.put(`/superadmin/subscriptions/${userId}`, payload);

export const fetchSuperAdminSubscriptionHistory = (userId: number, limit = 50) =>
  api.get<{ success: boolean; data: SubscriptionHistoryEntry[] }>(`/superadmin/subscriptions/history/${userId}`, {
    params: { limit },
  });

export const expireSuperAdminSubscription = (userId: number) =>
  api.put(`/superadmin/subscriptions/expire/${userId}`, {});

