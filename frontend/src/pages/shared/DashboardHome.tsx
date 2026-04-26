import { useEffect, useState } from 'react';
import { QuickLinks, ActivityFeed } from '@/components/AppShellWidgets';
import { InternshipBarChart, AnalyticsLineChart, RoleDistributionChart } from '@/components/Charts';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { CompanyProfileCard } from '@/components/CompanyProfileCard';
import type { Role } from '@/types';
import type { ChartPoint, DashboardMetric } from '@/types';
import { dashboardApi } from '@/api/dashboardApi';

const fallbackMetrics: Record<Role, DashboardMetric[]> = {
  Student: [
    { label: 'Applications', value: '0', delta: 'live', tone: 'sky' },
    { label: 'Opportunities', value: '0', delta: 'live', tone: 'mint' },
    { label: 'Unread updates', value: '0', delta: 'live', tone: 'amber' },
    { label: 'Accepted', value: '0', delta: 'live', tone: 'coral' },
  ],
  Recruiter: [
    { label: 'Open internships', value: '0', delta: 'live', tone: 'sky' },
    { label: 'Applicants', value: '0', delta: 'live', tone: 'mint' },
    { label: 'Interviews', value: '0', delta: 'live', tone: 'amber' },
    { label: 'Published', value: '0', delta: 'live', tone: 'coral' },
  ],
  Admin: [
    { label: 'Users', value: '0', delta: 'live', tone: 'sky' },
    { label: 'Companies', value: '0', delta: 'live', tone: 'mint' },
    { label: 'Internships', value: '0', delta: 'live', tone: 'amber' },
    { label: 'Applications', value: '0', delta: 'live', tone: 'coral' },
  ],
};

const roleHero: Record<
  Role,
  {
    eyebrow: string;
    title: string;
    description: string;
    accent: string;
    chips: { label: string; value: string }[];
  }
> = {
  Student: {
    eyebrow: 'Student workspace',
    title: 'Stay on top of applications, opportunities, and recruiter updates.',
    description: 'A focused view for managing your internship journey without extra clutter.',
    accent: 'from-sky-500/10 to-mint-500/10',
    chips: [
      { label: 'Focus', value: 'Applications' },
      { label: 'Priority', value: 'Opportunities' },
      { label: 'Live', value: 'Notifications' },
    ],
  },
  Recruiter: {
    eyebrow: 'Recruiter workspace',
    title: 'Manage openings, applicants, and hiring flow from one command center.',
    description: 'See the pipeline clearly and keep your hiring motion organized.',
    accent: 'from-mint-500/10 to-sky-500/10',
    chips: [
      { label: 'Focus', value: 'Applicants' },
      { label: 'Priority', value: 'Open roles' },
      { label: 'Live', value: 'Interviews' },
    ],
  },
  Admin: {
    eyebrow: 'Governance center',
    title: 'Monitor users, permissions, reports, and audit activity at a glance.',
    description: 'A cleaner control surface for system-wide oversight and reporting.',
    accent: 'from-amber-500/10 to-sky-500/10',
    chips: [
      { label: 'Focus', value: 'Users' },
      { label: 'Priority', value: 'Reports' },
      { label: 'Live', value: 'Audit logs' },
    ],
  },
};

export function DashboardHome({ role, title, description }: { role: Role; title: string; description: string }) {
  const [metrics, setMetrics] = useState<DashboardMetric[]>(fallbackMetrics[role]);
  const [timeline, setTimeline] = useState<ChartPoint[]>([]);
  const [breakdown, setBreakdown] = useState<ChartPoint[]>([]);
  const hero = roleHero[role];

  const loadSummary = async () => {
    const response = await dashboardApi.summary(role);
    const summary = response.data.data;
    if (!summary) return;
    setMetrics(summary.metrics);
    setTimeline(summary.timeline);
    setBreakdown(summary.breakdown);
  };

  useEffect(() => {
    void loadSummary();
  }, [role]);

  useEffect(() => {
    const refresh = () => void loadSummary();
    window.addEventListener('dashboard.updated', refresh as EventListener);
    window.addEventListener('workspace.updated', refresh as EventListener);
    return () => {
      window.removeEventListener('dashboard.updated', refresh as EventListener);
      window.removeEventListener('workspace.updated', refresh as EventListener);
    };
  }, [role]);

  return (
    <div className="space-y-5">
      {role === 'Recruiter' && <CompanyProfileCard showLink={true} />}
      <SectionHeader
        title={title}
        description={description}
        action={<div className="rounded-full border border-black/6 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:border-white/8 dark:bg-white/[0.04]">Live workspace</div>}
      />
      <div className={`glass-panel grid gap-5 rounded-3xl p-6 lg:grid-cols-[1.25fr_0.75fr] bg-gradient-to-br ${hero.accent}`}>
        <div>
          <div className="inline-flex items-center rounded-full border border-black/6 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-600 dark:border-white/8 dark:bg-white/[0.05] dark:text-ink-200">
            {hero.eyebrow}
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink-950 dark:text-white">
            {hero.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 dark:text-ink-300">
            {hero.description} The panels below show the current health of your workspace, shortcuts, and role activity.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {hero.chips.map((chip) => (
              <div
                key={chip.label}
                className="rounded-full border border-black/6 bg-white/70 px-3 py-1 text-xs text-ink-600 dark:border-white/8 dark:bg-white/[0.05] dark:text-ink-200"
              >
                <span className="font-semibold text-ink-950 dark:text-white">{chip.label}:</span> {chip.value}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {metrics.slice(0, 3).map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-black/6 bg-white/80 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] dark:border-white/8 dark:bg-white/[0.04]">
              <div className="text-xs uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">{metric.label}</div>
              <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{metric.value}</div>
              <div className="mt-2 text-xs text-ink-500 dark:text-ink-300">{metric.delta}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="text-base font-semibold text-ink-950 dark:text-white">Applications analytics</h3>
          <div className="mt-5 h-[320px]">
            <AnalyticsLineChart data={timeline} />
          </div>
        </div>
        <ActivityFeed points={timeline} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.85fr]">
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="text-base font-semibold text-ink-950 dark:text-white">Internship statistics</h3>
          <div className="mt-5 h-[280px]">
            <InternshipBarChart data={breakdown} />
          </div>
        </div>
        <QuickLinks role={role} />
        <div className="glass-panel rounded-3xl p-5">
          <h3 className="text-base font-semibold text-ink-950 dark:text-white">Role mix</h3>
          <div className="mt-5 h-[280px]">
            <RoleDistributionChart data={breakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
