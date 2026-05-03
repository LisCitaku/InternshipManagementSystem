import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface RecruiterApprovalRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  companyName: string;
  companyWebsite?: string | null;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
}

export const recruiterRequestsApi = {
  list() {
    return apiClient.get<ApiResponse<RecruiterApprovalRequest[]>>('/api/recruiterrequests');
  },
  approve(requestId: string) {
    return apiClient.put<ApiResponse<boolean>>(`/api/recruiterrequests/${requestId}/approve`, {});
  },
  reject(requestId: string) {
    return apiClient.put<ApiResponse<boolean>>(`/api/recruiterrequests/${requestId}/reject`, {});
  },
};
