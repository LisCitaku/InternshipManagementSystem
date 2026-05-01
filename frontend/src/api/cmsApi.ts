import { apiClient } from './client';
import type { ApiResponse, CmsPage, CmsPageUpdateRequest } from '@/types';

export const cmsApi = {
  get(pageKey: string) {
    return apiClient.get<ApiResponse<CmsPage>>(`/api/cms/${pageKey}`);
  },
  update(pageKey: string, payload: CmsPageUpdateRequest) {
    return apiClient.put<ApiResponse<CmsPage>>(`/api/cms/${pageKey}`, payload);
  },
};
