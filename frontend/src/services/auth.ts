import { api } from './api';

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export const requestPasswordReset = (payload: ForgotPasswordPayload) =>
  api.post('/auth/forgot-password', payload);

export const resetPasswordWithToken = (payload: ResetPasswordPayload) =>
  api.post('/auth/reset-password', payload);



