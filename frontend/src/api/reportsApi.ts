import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface ReportPayload {
  name: string;
  type: number;
  parameters?: Record<string, string>;
}

export const reportsApi = {
  generate(payload: ReportPayload) {
    return apiClient.post<ApiResponse<{ id: string; name: string; type: number; resultJson: string; createdAt: string }>>(
      '/api/reports/generate',
      payload,
    );
  },
  export(payload: { entity: string; format: string; filters?: Record<string, string> }) {
    return apiClient.post('/api/reports/export', payload, { responseType: 'blob' });
  },
};
