import { cn } from '@/utils/cn';
import type { DashboardMetric } from '@/types';

const toneStyles: Record<DashboardMetric['tone'], string> = {
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  mint: 'bg-mint-500/10 text-mint-600 dark:text-mint-300',
  coral: 'bg-coral-500/10 text-coral-500 dark:text-coral-300',
  amber: 'bg-amber-400/14 text-amber-700 dark:text-amber-200',
};

export function MetricCard({ label, value, delta, tone }: DashboardMetric) {
  return (
    <article className="glass-panel rounded-2xl p-5 shadow-[0_18px_50px_-35px_rgba(36,51,79,0.2)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-600 dark:text-ink-300">{label}</span>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', toneStyles[tone])}>{delta}</span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-ink-950 dark:text-white">{value}</div>
    </article>
  );
}
