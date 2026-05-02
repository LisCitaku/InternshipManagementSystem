import { apiClient } from './client';
import type { ApiResponse, Category, Company, PagedResult } from '@/types';

export const lookupsApi = {
  companies() {
    return apiClient.get<ApiResponse<PagedResult<Company>>>('/api/companies', {
      params: { pageNumber: 1, pageSize: 100 },
    });
  },
  companyById(id: string) {
    return apiClient.get<ApiResponse<Company>>(`/api/companies/${id}`);
  },
  myCompany() {
    return apiClient.get<ApiResponse<Company | null>>('/api/companies/my-company');
  },
  createMyCompany(payload: { name: string; website: string; location: string; description: string }) {
    return apiClient.post<ApiResponse<Company>>('/api/companies/my-company', payload);
  },
  updateMyCompany(payload: { name: string; website: string; location: string; description: string }) {
    return apiClient.put<ApiResponse<Company>>('/api/companies/my-company', payload);
  },
  categories() {
    return apiClient.get<ApiResponse<PagedResult<Category>>>('/api/categories', {
      params: { pageNumber: 1, pageSize: 100 },
    });
  },
};
