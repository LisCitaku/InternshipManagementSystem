import { apiClient } from './client';
import type { ApiResponse, Internship, PagedResult } from '@/types';

export interface InternshipSearchParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  companyId?: string;
  categoryId?: string;
  location?: string;
  sortBy?: string;
  descending?: boolean;
  includeInactive?: boolean;
}

const internshipStatusLabel: Record<string, string> = {
  '1': 'Draft',
  '2': 'Published',
  '3': 'Closed',
  '4': 'Archived',
  Draft: 'Draft',
  Published: 'Published',
  Closed: 'Closed',
  Archived: 'Archived',
};

const normalizeInternship = (internship: Internship): Internship => ({
  ...internship,
  status: internshipStatusLabel[String(internship.status)] ?? internship.status,
  company: internship.company ?? { id: '', name: '', description: null, website: null, location: null, isVerified: false },
  category: internship.category ?? '',
  maxApplicants: internship.maxApplicants ?? 0,
  currentApplicants: internship.currentApplicants ?? 0,
});

export const internshipsApi = {
  list(params: InternshipSearchParams) {
    return apiClient.get<ApiResponse<PagedResult<Internship>>>('/api/internships', { params }).then((response) => ({
      ...response,
      data: {
        ...response.data,
        data: response.data.data
          ? {
              ...response.data.data,
              items: response.data.data.items.map(normalizeInternship),
            }
          : response.data.data,
      },
    }));
  },
  byId(id: string) {
    return apiClient.get<ApiResponse<Internship>>(`/api/internships/${id}`).then((response) => ({
      ...response,
      data: {
        ...response.data,
        data: response.data.data ? normalizeInternship(response.data.data) : response.data.data,
      },
    }));
  },
  create(payload: {
    companyId: string;
    categoryId: string;
    title: string;
    description: string;
    location: string;
    type: number;
    maxApplicants: number;
    salaryMin?: number;
    salaryMax?: number;
    deadlineAt?: string;
    publishNow: boolean;
  }) {
    return apiClient.post<ApiResponse<Internship>>('/api/internships', payload);
  },
  updateCapacity(id: string, payload: { maxApplicants: number }) {
    return apiClient.put<ApiResponse<Internship>>(`/api/internships/${id}/capacity`, payload);
  },
  delete(id: string) {
    return apiClient.delete<ApiResponse<boolean>>(`/api/internships/${id}`);
  },
};
