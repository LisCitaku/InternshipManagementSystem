import type { ReactNode } from 'react';

interface AuthCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthCard({ eyebrow, title, description, children }: AuthCardProps) {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="glass-panel rounded-3xl p-8 lg:p-10">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.26em] text-mint-600">{eyebrow}</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-950 dark:text-white">
            {title === 'Login'
              ? 'Welcome back to the workspace.'
              : title === 'Register'
                ? 'Start a clean onboarding flow.'
                : 'Hiring, applications, and campus pipelines in one place.'}
          </h1>
          <p className="mt-4 text-base leading-7 text-ink-600 dark:text-ink-300">{description}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Students', 'Track every application and save matching roles.'],
            ['Recruiters', 'Manage pipelines, interviews, and messaging.'],
            ['Admins', 'Control permissions, audit activity, and reporting.'],
          ].map(([label, copy]) => (
            <div key={label} className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 shadow-[0_12px_30px_-26px_rgba(36,51,79,0.2)] dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">{label}</div>
              <div className="mt-2 text-sm text-ink-600 dark:text-ink-300">{copy}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8 lg:p-10">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">{title}</div>
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
