import { apiClient } from './client';
import type { ApiResponse, AuthTokens } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  registrationType: 'Student' | 'Recruiter';
  companyName?: string;
  companyWebsite?: string;
}

export const authApi = {
  login(payload: LoginPayload) {
    return apiClient.post<ApiResponse<AuthTokens>>('/api/auth/login', payload);
  },
  register(payload: RegisterPayload) {
    return apiClient.post<ApiResponse<AuthTokens>>('/api/auth/register', payload);
  },
  refresh(refreshToken: string) {
    return apiClient.post<ApiResponse<AuthTokens>>('/api/auth/refresh-token', { refreshToken });
  },
};
