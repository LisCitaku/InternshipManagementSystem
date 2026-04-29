import { NavLink } from 'react-router-dom';
import { Bell, BriefcaseBusiness, FileBarChart2, MessageSquare, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import type { ChartPoint, Role } from '@/types';

const quickLinksByRole: Record<Role, { icon: LucideIcon; label: string; to: string }[]> = {
  Student: [
    { icon: BriefcaseBusiness, label: 'Opportunities', to: '/student/saved-jobs' },
    { icon: Users, label: 'Profile', to: '/student/profile' },
    { icon: Bell, label: 'Notifications', to: '/student/notifications' },
    { icon: MessageSquare, label: 'Chat', to: '/student/chat' },
  ],
  Recruiter: [
    { icon: BriefcaseBusiness, label: 'Internships', to: '/recruiter/manage-internships' },
    { icon: Users, label: 'Applicants', to: '/recruiter/applicants' },
    { icon: MessageSquare, label: 'Chat', to: '/recruiter/chat' },
    { icon: Bell, label: 'Alerts', to: '/recruiter/dashboard' },
  ],
  Admin: [
    { icon: Users, label: 'Users', to: '/admin/users' },
    { icon: ShieldCheck, label: 'Permissions', to: '/admin/permissions' },
    { icon: FileBarChart2, label: 'Reports', to: '/admin/reports' },
    { icon: Bell, label: 'Audit logs', to: '/admin/audit-logs' },
  ],
};

export function QuickLinks({ role }: { role: Role }) {
  const items = quickLinksByRole[role];

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600">Workspace shortcuts</div>
          <h3 className="mt-1 text-base font-semibold text-ink-950 dark:text-white">{role} actions</h3>
        </div>
        <div className="rounded-full border border-black/6 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 dark:border-white/8 dark:bg-white/[0.04] dark:text-ink-300">
          {items.length} links
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-25px_rgba(15,23,42,0.25)] dark:border-white/8 dark:bg-white/[0.03] ${
                isActive ? 'border-sky-500/40 bg-sky-500/10' : 'border-black/6 bg-black/[0.03] hover:bg-white/75 dark:hover:bg-white/[0.06]'
              }`
            }
          >
            <item.icon size={18} className="text-sky-500" />
            <div className="mt-3 text-sm font-semibold text-ink-950 dark:text-white">{item.label}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeed({ points }: { points: ChartPoint[] }) {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Activity</div>
          <h3 className="mt-1 text-base font-semibold text-ink-950 dark:text-white">Momentum</h3>
        </div>
        <div className="rounded-full border border-black/6 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 dark:border-white/8 dark:bg-white/[0.04] dark:text-ink-300">
          live
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {points.map((point) => (
          <div key={point.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-700 dark:text-ink-200">{point.label}</span>
              <span className="text-ink-500 dark:text-ink-300">{point.value} actions</span>
            </div>
            <div className="h-2 rounded-full bg-black/6 dark:bg-white/10">
              <div className="h-2 rounded-full bg-sky-500" style={{ width: `${point.value * 4}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
