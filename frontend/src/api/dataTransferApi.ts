import { apiClient } from './client';
import type { ApiResponse, ImportResult } from '@/types';

export const dataTransferApi = {
  exportData(payload: { entity: string; format: string; filters?: Record<string, string> }) {
    return apiClient.post('/api/reports/export', payload, { responseType: 'blob' });
  },
  importData(payload: { entity: string; format: string; file: File }) {
    const formData = new FormData();
    formData.append('entity', payload.entity);
    formData.append('format', payload.format);
    formData.append('file', payload.file);
    return apiClient.post<ApiResponse<ImportResult>>('/api/reports/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
