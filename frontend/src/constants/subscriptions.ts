import type { SubscriptionPlan } from '../services/subscriptions';

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: ['basic_profile', 'public_profile'],
  trial: ['basic_profile', 'public_profile', 'social_links', 'custom_links', 'qr_code', 'collaborations', 'payment'],
  basic: ['basic_profile', 'public_profile', 'social_links', 'custom_links', 'qr_code', 'collaborations'],
  premium: ['basic_profile', 'public_profile', 'social_links', 'custom_links', 'qr_code', 'collaborations', 'payment'],
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Free',
  trial: 'Trial',
  basic: 'Basic',
  premium: 'Premium',
};

export const FEATURE_LABELS: Record<string, string> = {
  basic_profile: 'Profile management',
  public_profile: 'Public profile page',
  social_links: 'Social links',
  custom_links: 'Custom links',
  qr_code: 'QR Code Scanning',
  payment: 'UPI payments',
  collaborations: 'Proud Member Of',
};

