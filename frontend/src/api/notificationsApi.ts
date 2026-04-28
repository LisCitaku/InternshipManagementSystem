import { apiClient } from './client';
import type { ApiResponse, NotificationItem, PagedResult } from '@/types';

export const notificationsApi = {
  list(params: { pageNumber?: number; pageSize?: number; search?: string }) {
    return apiClient.get<ApiResponse<PagedResult<NotificationItem>>>('/api/notifications', { params });
  },
  markAsRead(notificationId: string) {
    return apiClient.put<ApiResponse<boolean>>(`/api/notifications/${notificationId}/read`, {});
  },
  markAllAsRead() {
    return apiClient.put<ApiResponse<boolean>>('/api/notifications/read-all', {});
  },
};
