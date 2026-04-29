import { apiClient } from './client';
import type { ApiResponse, ChartPoint, DashboardMetric } from '@/types';

export interface DashboardSummary {
  metrics: DashboardMetric[];
  timeline: ChartPoint[];
  breakdown: ChartPoint[];
}

export const dashboardApi = {
  summary(role: string) {
    return apiClient.get<ApiResponse<DashboardSummary>>('/api/dashboard/summary', { params: { role } });
  },
};
