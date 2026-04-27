import { useEffect, useMemo, useState } from 'react';
import { Download, FileJson, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { dataTransferApi } from '@/api/dataTransferApi';
import { reportsApi } from '@/api/reportsApi';
import { Button } from '@/components/Button';
import { InternshipBarChart, AnalyticsLineChart } from '@/components/Charts';
import { SectionHeader } from '@/components/SectionHeader';
import type { ChartPoint } from '@/types';

type ReportSummary = {
  total?: number;
  published?: number;
  draft?: number;
  verified?: number;
  active?: number;
  inactive?: number;
  approved?: number;
  rejected?: number;
  byStatus?: Array<{ Status: string; Count: number }>;
  byLocation?: Array<{ Location: string; Count: number }>;
  byType?: Array<{ Type: string; Count: number }>;
};

const normalizeReportSummary = (payload: Record<string, unknown>): ReportSummary => ({
  total: (payload.total as number | undefined) ?? (payload.Total as number | undefined),
  published: (payload.published as number | undefined) ?? (payload.Published as number | undefined),
  draft: (payload.draft as number | undefined) ?? (payload.Draft as number | undefined),
  verified: (payload.verified as number | undefined) ?? (payload.Verified as number | undefined),
  active: (payload.active as number | undefined) ?? (payload.Active as number | undefined),
  inactive: (payload.inactive as number | undefined) ?? (payload.Inactive as number | undefined),
  approved: (payload.approved as number | undefined) ?? (payload.Approved as number | undefined),
  rejected: (payload.rejected as number | undefined) ?? (payload.Rejected as number | undefined),
  byStatus: (payload.byStatus as Array<{ Status: string; Count: number }> | undefined) ?? (payload.ByStatus as Array<{ Status: string; Count: number }> | undefined),
  byLocation: (payload.byLocation as Array<{ Location: string; Count: number }> | undefined) ?? (payload.ByLocation as Array<{ Location: string; Count: number }> | undefined),
  byType: (payload.byType as Array<{ Type: string; Count: number }> | undefined) ?? (payload.ByType as Array<{ Type: string; Count: number }> | undefined),
});

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [applicationsData, setApplicationsData] = useState<ChartPoint[]>([]);
  const [internshipsData, setInternshipsData] = useState<ChartPoint[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({});

  const loadReports = async () => {
    setLoading(true);
    try {
      const [applicationsResponse, internshipsResponse] = await Promise.all([
        reportsApi.generate({ name: 'Live Applications Report', type: 1 }),
        reportsApi.generate({ name: 'Live Internships Report', type: 2 }),
      ]);

      const applications = normalizeReportSummary(JSON.parse(applicationsResponse.data.data?.resultJson ?? '{}') as Record<string, unknown>);
      const internships = normalizeReportSummary(JSON.parse(internshipsResponse.data.data?.resultJson ?? '{}') as Record<string, unknown>);

      setSummary({
        total: applications.total ?? internships.total,
        approved: applications.approved,
        rejected: applications.rejected,
        verified: internships.verified,
        active: internships.published,
        inactive: internships.draft,
      });

      setApplicationsData(
        (applications.byStatus ?? []).map((item) => ({
          label: item.Status,
          value: item.Count,
        })),
      );
      setInternshipsData(
        (internships.byType ?? []).map((item) => ({
          label: item.Type,
          value: item.Count,
        })),
      );
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
    const handleUpdate = () => void loadReports();
    window.addEventListener('dashboard.updated', handleUpdate as EventListener);
    window.addEventListener('workspace.updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('dashboard.updated', handleUpdate as EventListener);
      window.removeEventListener('workspace.updated', handleUpdate as EventListener);
    };
  }, []);

  const quickStats = useMemo(
    () => [
      ['Total', summary.total ?? 0],
      ['Approved', summary.approved ?? 0],
      ['Rejected', summary.rejected ?? 0],
      ['Verified companies', summary.verified ?? 0],
    ],
    [summary],
  );

  const exportData = async (format: 'csv' | 'json' | 'xlsx') => {
    const response = await dataTransferApi.exportData({ entity: 'applications', format });
    const contentType = String(response.headers['content-type'] ?? 'application/octet-stream');
    const blob = new Blob([response.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `applications.${format === 'xlsx' ? 'xlsx' : format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Reports"
        description="Dynamic reports, exports, and charts for application flow and internship activity."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void loadReports()} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => exportData('xlsx')}>
              <FileSpreadsheet size={16} />
              Export Excel
            </Button>
            <Button variant="secondary" onClick={() => exportData('csv')}>
              <Download size={16} />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => exportData('json')}>
              <FileJson size={16} />
              Export JSON
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-4">
        {quickStats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel rounded-lg p-5">
          <h3 className="text-base font-semibold">Applications by weekday</h3>
          <div className="mt-5 h-[320px]">
            <AnalyticsLineChart data={applicationsData.length ? applicationsData : [{ label: 'No data', value: 0 }]} />
          </div>
        </div>
        <div className="glass-panel rounded-lg p-5">
          <h3 className="text-base font-semibold">Internship publishing cadence</h3>
          <div className="mt-5 h-[320px]">
            <InternshipBarChart data={internshipsData.length ? internshipsData : [{ label: 'No data', value: 0 }]} />
          </div>
        </div>
      </div>
      <div className="text-xs text-ink-500 dark:text-ink-300">Last updated: {lastUpdated || '—'}</div>
    </div>
  );
}
