import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="relative overflow-hidden flex flex-col gap-4 rounded-2xl border border-black/6 bg-gradient-to-r from-white/72 via-white/60 to-sky-50/40 px-5 py-4 shadow-[0_18px_50px_-30px_rgba(36,51,79,0.18)] backdrop-blur dark:border-white/8 dark:from-white/[0.04] dark:via-white/[0.03] dark:to-white/[0.02] md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-mint-600 dark:text-mint-300">Workspace</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950 dark:text-white">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-300">{description}</p>
      </div>
      {action}
    </div>
  );
}
