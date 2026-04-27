import { apiClient } from './client';
import type { ApiResponse, CurrentUserProfileDto, PagedResult, Role, User } from '@/types';
import { normalizeUser, toApiRole } from '@/utils/roles';

export interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  role?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: Role;
}

export interface LinkCompanyPayload {
  companyId: string;
}

export const usersApi = {
  async getMe() {
    const response = await apiClient.get<ApiResponse<User>>('/api/users/me');
    return {
      ...response,
      data: {
        ...response.data,
        data: response.data.data ? normalizeUser(response.data.data) : response.data.data,
      },
    };
  },
  async getCurrentProfile() {
    return apiClient.get<ApiResponse<CurrentUserProfileDto>>('/api/users/me/profile');
  },
  async getUsers(params: GetUsersParams) {
    const response = await apiClient.get<ApiResponse<PagedResult<User>>>('/api/users', { params });
    return {
      ...response,
      data: {
        ...response.data,
        data: response.data.data
          ? {
              ...response.data.data,
              items: response.data.data.items.map((user) => normalizeUser(user)),
            }
          : response.data.data,
      },
    };
  },
  async createUser(payload: CreateUserPayload) {
    const response = await apiClient.post<ApiResponse<User>>('/api/users', {
      ...payload,
      role: toApiRole(payload.role),
    });
    return {
      ...response,
      data: {
        ...response.data,
        data: response.data.data ? normalizeUser(response.data.data) : response.data.data,
      },
    };
  },
  async updateUserRole(userId: string, role: Role) {
    const response = await apiClient.put<ApiResponse<User>>(`/api/users/${userId}/role`, {
      role: toApiRole(role),
    });
    return {
      ...response,
      data: {
        ...response.data,
        data: response.data.data ? normalizeUser(response.data.data) : response.data.data,
      },
    };
  },
  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await apiClient.put<ApiResponse<User>>(`/api/users/${userId}/status`, { isActive });
    return {
      ...response,
      data: {
        ...response.data,
        data: response.data.data ? normalizeUser(response.data.data) : response.data.data,
      },
    };
  },
  async linkCompanyToUser(userId: string, companyId: string) {
    const response = await apiClient.put<ApiResponse<unknown>>(`/api/companies/${companyId}/users/${userId}`, {});
    return response;
  },
};
