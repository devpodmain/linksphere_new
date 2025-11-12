import { api } from './api';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionPeriod,
  SubscriptionUpdatePayload,
  SubscriptionHistoryEntry,
} from './subscriptions';

export interface AdminUserListParams {
  search?: string;
  page?: number;
  per_page?: number;
  status?: 'active' | 'disabled';
  plan?: SubscriptionPlan;
  role?: 'user' | 'admin';
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_period: SubscriptionPeriod | null;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserResponse {
  success: boolean;
  data: AdminUser[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface AdminUserDetailResponse {
  success: boolean;
  user: AdminUser & {
    profile: Record<string, unknown> | null;
  };
}

export interface UpdateUserStatusPayload {
  status: 'active' | 'disabled';
}

export interface AdminSubscriptionListParams {
  search?: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  page?: number;
  per_page?: number;
}

export interface AdminSubscription {
  id: number;
  name: string;
  email: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_period: SubscriptionPeriod | null;
  subscription_expires_at: string | null;
  account_status: 'active' | 'disabled';
  history: SubscriptionHistoryEntry[];
}

export interface AdminSubscriptionResponse {
  success: boolean;
  data: AdminSubscription[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export const getUsers = (params?: AdminUserListParams) =>
  api.get<AdminUserResponse>('/admin/users', { params });

export const getUser = (id: number) =>
  api.get<AdminUserDetailResponse>(`/admin/users/${id}`);

export const updateUserStatus = (id: number, payload: UpdateUserStatusPayload) =>
  api.put(`/admin/users/${id}/status`, payload);

export const deleteUser = (id: number) =>
  api.delete(`/admin/users/${id}`);

export const fetchAdminSubscriptions = (params?: AdminSubscriptionListParams) =>
  api.get<AdminSubscriptionResponse>('/admin/subscriptions', { params });

export const fetchAdminSubscriptionHistory = (userId: number, limit = 50) =>
  api.get<{ success: boolean; data: SubscriptionHistoryEntry[] }>(`/admin/subscriptions/history/${userId}`, {
    params: { limit },
  });

