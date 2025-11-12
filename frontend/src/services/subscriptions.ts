import { api } from './api';

export type SubscriptionPlan = 'trial' | 'free' | 'basic' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'paused';
export type SubscriptionPeriod = 'trial' | 'monthly' | 'yearly';

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  period: SubscriptionPeriod | null;
  expires_at: string | null;
  remaining_days: number | null;
}

export interface SubscriptionHistoryEntry {
  previous_plan: SubscriptionPlan | null;
  new_plan: SubscriptionPlan;
  status: SubscriptionStatus;
  period: SubscriptionPeriod | null;
  expires_at: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription: SubscriptionSummary;
}

export interface SubscriptionAccessResponse {
  success: boolean;
  plan: SubscriptionPlan;
  features: string[];
}

export interface SubscriptionUpdatePayload {
  plan: SubscriptionPlan;
  period?: SubscriptionPeriod | '';
  expires_at?: string | null;
  status?: SubscriptionStatus | '';
}

export const fetchMySubscription = () =>
  api.get<SubscriptionResponse>('/subscriptions/me');

export const fetchSubscriptionAccess = () =>
  api.get<SubscriptionAccessResponse>('/subscriptions/access');

export const updateUserSubscription = (userId: number, payload: SubscriptionUpdatePayload) =>
  api.put(`/subscriptions/update/${userId}`, payload);

export const expireUserSubscription = (userId: number) =>
  api.put(`/subscriptions/expire/${userId}`, {});


