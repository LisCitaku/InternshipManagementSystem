import { apiClient } from './client';
import type { ApiResponse, ApplicationItem, PagedResult } from '@/types';

export interface ApplicationSearchParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  internshipId?: string;
  applicantUserId?: string;
  descending?: boolean;
}

export interface CreateApplicationPayload {
  internshipId: string;
  coverLetter?: string;
  resumeUrl?: string;
  phoneNumber?: string;
  university?: string;
  fieldOfStudy?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

export type ApplicationStatus = 'Submitted' | 'In Review' | 'Interview' | 'Accepted' | 'Rejected';

export const applicationsApi = {
  list(params: ApplicationSearchParams) {
    return apiClient.get<ApiResponse<PagedResult<ApplicationItem>>>('/api/applications', { params });
  },
  mine(params: ApplicationSearchParams) {
    return apiClient.get<ApiResponse<PagedResult<ApplicationItem>>>('/api/applications/my', { params });
  },
  create(payload: CreateApplicationPayload) {
    return apiClient.post<ApiResponse<ApplicationItem>>('/api/applications', payload);
  },
  updateStatus(applicationId: string, status: ApplicationStatus) {
    return apiClient.put<ApiResponse<ApplicationItem>>(`/api/applications/${applicationId}/status`, { status });
  },
};
