import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import type { ApiResponse, AuthTokens } from '@/types';
import { normalizeUser } from '@/utils/roles';
import { storage } from '@/utils/storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5112';
const MAX_REFRESH_ATTEMPTS = 3;

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean; _refreshAttempts?: number };

let activeTokens: AuthTokens | null = storage.getAuth();

export const setActiveTokens = (tokens: AuthTokens | null) => {
  const normalized = tokens
    ? {
        ...tokens,
        user: normalizeUser(tokens.user),
      }
    : null;
  activeTokens = normalized;
  storage.setAuth(normalized);
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (activeTokens?.accessToken) {
    config.headers.Authorization = `Bearer ${activeTokens.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<AuthTokens>>) => {
    const request = error.config as RetryableRequest | undefined;
    const refreshAttempts = request?._refreshAttempts ?? 0;

    if (error.response?.status === 401 && request && !request._retry && activeTokens?.refreshToken && refreshAttempts < MAX_REFRESH_ATTEMPTS) {
      request._retry = true;
      request._refreshAttempts = (request._refreshAttempts ?? 0) + 1;

      try {
        const response = await axios.post<ApiResponse<AuthTokens>>(`${API_URL}/api/auth/refresh-token`, {
          refreshToken: activeTokens.refreshToken,
        });

        if (response.data.data) {
          setActiveTokens(response.data.data);
          request.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return apiClient(request);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        setActiveTokens(null);
      }
    }

    const errorMessage =
      error.response?.data?.errors?.[0] ??
      error.response?.data?.message ??
      error.message ??
      'Something went wrong while contacting the server.';

    toast.error(errorMessage);
    return Promise.reject(error);
  },
);
