import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, BriefcaseBusiness, CheckCircle2, Search, Sparkles, TrendingUp } from 'lucide-react';
import { dashboardApi } from '@/api/dashboardApi';
import { internshipsApi } from '@/api/internshipsApi';
import { profileApi } from '@/api/profileApi';
import { useAppSelector } from '@/hooks/useAppStore';
import { SectionHeader } from '@/components/SectionHeader';
import { Loader } from '@/components/Loader';
import type { ChartPoint, DashboardMetric } from '@/types';
import { buildRecommendedInternships, getProfileCompletion, type RecommendedInternship, type ProfileCompletion } from '@/utils/studentInsights';

const fallbackMetrics: DashboardMetric[] = [
  { label: 'Applications', value: '0', delta: 'live', tone: 'sky' },
  { label: 'Opportunities', value: '0', delta: 'live', tone: 'mint' },
  { label: 'Unread updates', value: '0', delta: 'live', tone: 'amber' },
  { label: 'Accepted', value: '0', delta: 'live', tone: 'coral' },
];

const studentLinks = [
  { to: '/student/saved-jobs', label: 'Browse opportunities', icon: Search, description: 'Discover internships and keep the ones you like.' },
  { to: '/student/applications', label: 'View applications', icon: BriefcaseBusiness, description: 'Track every submission and its current status.' },
  { to: '/student/notifications', label: 'Check notifications', icon: Bell, description: 'See real-time updates from recruiters.' },
];

export default function StudentDashboardPage() {
  const session = useAppSelector((state) => state.auth.session);
  const [metrics, setMetrics] = useState<DashboardMetric[]>(fallbackMetrics);
  const [timeline, setTimeline] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [recommendedInternships, setRecommendedInternships] = useState<RecommendedInternship[]>([]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.summary('Student');
      const summary = response.data.data;
      if (summary) {
        setMetrics(summary.metrics.length > 0 ? summary.metrics : fallbackMetrics);
        setTimeline(summary.timeline);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setInsightLoading(true);
    setProfileCompletion(null);
    setRecommendedInternships([]);
    try {
      const [profileResponse, internshipsResponse] = await Promise.all([
        profileApi.getMine(),
        internshipsApi.list({ pageNumber: 1, pageSize: 30, includeInactive: false }),
      ]);

      const profile = profileResponse.data.data;
      const internships = internshipsResponse.data.data?.items ?? [];

      if (profile) {
        setProfileCompletion(getProfileCompletion(profile));
        setRecommendedInternships(buildRecommendedInternships(internships, profile, 3));
      }
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
    void loadInsights();
  }, []);

  useEffect(() => {
    const refresh = () => void loadSummary();
    window.addEventListener('dashboard.updated', refresh as EventListener);
    window.addEventListener('workspace.updated', refresh as EventListener);
    window.addEventListener('application.submitted', refresh as EventListener);
    window.addEventListener('internship.published', refresh as EventListener);
    return () => {
      window.removeEventListener('dashboard.updated', refresh as EventListener);
      window.removeEventListener('workspace.updated', refresh as EventListener);
      window.removeEventListener('application.submitted', refresh as EventListener);
      window.removeEventListener('internship.published', refresh as EventListener);
    };
  }, []);

  const unreadUpdates = useMemo(() => metrics.find((metric) => metric.label === 'Unread updates')?.value ?? '0', [metrics]);
  const applications = useMemo(() => metrics.find((metric) => metric.label === 'Applications')?.value ?? '0', [metrics]);
  const savedJobs = useMemo(() => metrics.find((metric) => metric.label === 'Opportunities')?.value ?? '0', [metrics]);
  const accepted = useMemo(() => metrics.find((metric) => metric.label === 'Accepted')?.value ?? '0', [metrics]);
  const latestSteps = timeline.slice(0, 3);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Student dashboard"
        description="Your personal space for internships, applications, saved jobs, and live updates."
        action={
          <div className="rounded-full border border-black/6 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:border-white/8 dark:bg-white/[0.04]">
            {session?.user.firstName} {session?.user.lastName}
          </div>
        }
      />

      <div className="glass-panel grid gap-5 rounded-3xl p-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-200">
            <Sparkles size={14} />
            Focused for students
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink-950 dark:text-white">
            Keep track of your internship journey without the admin noise
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 dark:text-ink-300">
            This dashboard is built for your next step: what you applied to, what you saved, what was accepted, and what changed in real time.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Applications', applications],
              ['Opportunities', savedJobs],
              ['Unread updates', unreadUpdates],
              ['Accepted', accepted],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as string}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/6 bg-white/60 p-5 dark:border-white/8 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/12 text-sky-600 dark:text-sky-300">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-500 dark:text-ink-300">Your progress</div>
              <div className="text-lg font-semibold text-ink-950 dark:text-white">Live overview</div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {loading ? (
              <Loader label="Loading student dashboard..." />
            ) : (
              metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">{metric.label}</div>
                      <div className="mt-1 text-2xl font-semibold text-ink-950 dark:text-white">{metric.value}</div>
                    </div>
                    <div className="rounded-full border border-black/6 bg-white/60 px-3 py-1 text-xs font-semibold text-ink-600 dark:border-white/8 dark:bg-white/[0.04] dark:text-white/80">
                      live
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {profileCompletion ? (
            <div className="mt-5 rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">Profile completion</div>
                  <div className="mt-1 text-xl font-semibold text-ink-950 dark:text-white">{profileCompletion.score}%</div>
                </div>
                <div className="rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-200">
                  {profileCompletion.completed}/{profileCompletion.total}
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-black/6 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-mint-500 transition-all"
                  style={{ width: `${profileCompletion.score}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink-950 dark:text-white">Next actions</h3>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">What you should do next as a student.</p>
            </div>
            <CheckCircle2 className="text-mint-500" size={18} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {studentLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="rounded-2xl border border-black/6 bg-white/55 p-4 transition hover:-translate-y-0.5 hover:bg-white/75 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/12 text-sky-600 dark:text-sky-300">
                    <item.icon size={18} />
                  </span>
                  <div className="font-semibold text-ink-950 dark:text-white">{item.label}</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">{item.description}</p>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-ink-950 dark:text-white">Recent activity</h3>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">Your latest live updates.</p>

          <div className="mt-5 space-y-3">
            {latestSteps.length === 0 ? (
              <div className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 text-sm text-ink-500 dark:border-white/8 dark:bg-white/[0.03] dark:text-ink-300">
                No activity yet.
              </div>
            ) : (
              latestSteps.map((step) => (
                <div key={step.label} className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-ink-950 dark:text-white">{step.label}</div>
                    <div className="text-xs text-ink-500 dark:text-ink-300">{step.value} actions</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/6 dark:bg-white/10">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(Number(step.value) * 20, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink-950 dark:text-white">Recommended for you</h3>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Suggestions based on your profile and the internships currently available.
            </p>
          </div>
          <Sparkles className="text-sky-500" size={18} />
        </div>

        {insightLoading ? (
          <Loader label="Building recommendations..." />
        ) : recommendedInternships.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-black/6 bg-black/[0.03] p-4 text-sm text-ink-500 dark:border-white/8 dark:bg-white/[0.03] dark:text-ink-300">
            Add a field of study and headline in your profile to get better recommendations.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {recommendedInternships.map((item) => (
              <NavLink
                key={item.id}
                to="/student/saved-jobs"
                className="rounded-2xl border border-black/6 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">
                      {item.company?.name || 'Internship'}
                    </div>
                    <div className="mt-2 text-base font-semibold text-ink-950 dark:text-white">{item.title}</div>
                  </div>
                  <div className="rounded-full border border-sky-500/15 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-200">
                    {item.matchScore}%
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-black/6 bg-black/[0.03] px-2.5 py-1 text-[11px] font-medium text-ink-600 dark:border-white/8 dark:bg-white/[0.04] dark:text-ink-200"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
