import { apiClient } from './client';
import type { ApiResponse, CurrentUserProfileDto } from '@/types';

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  university: string;
  fieldOfStudy: string;
  headline: string;
  bio: string;
}

export const profileApi = {
  getMine() {
    return apiClient.get<ApiResponse<CurrentUserProfileDto>>('/api/users/me/profile');
  },
  updateMine(payload: UpdateProfilePayload) {
    return apiClient.put<ApiResponse<CurrentUserProfileDto>>('/api/users/me/profile', payload);
  },
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<CurrentUserProfileDto>>('/api/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadCv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<CurrentUserProfileDto>>('/api/users/me/cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
