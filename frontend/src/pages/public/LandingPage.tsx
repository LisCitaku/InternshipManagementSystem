import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ChartColumnIncreasing, MessageCircleMore, Sparkles, ShieldCheck, Users, GraduationCap, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cmsApi } from '@/api/cmsApi';
import type { CmsPage } from '@/types';

const fallbackLanding: CmsPage = {
  pageKey: 'landing',
  title: 'Landing Page',
  description: 'Public homepage content for the platform',
  updatedAt: new Date().toISOString(),
  fields: {
    hero_title: 'A cleaner way to manage internships, applicants, and roles.',
    hero_description: 'Built for universities and hiring teams that want a polished, real-time workflow from discovery to offer.',
    primary_cta: 'Log in',
    secondary_cta: 'Platform overview',
    feature_1_title: 'Internships',
    feature_1_body: 'Advanced search, saved jobs, and recruiter-managed listings.',
    feature_2_title: 'Realtime chat',
    feature_2_body: 'SignalR-powered chat and notifications across roles.',
    feature_3_title: 'Analytics',
    feature_3_body: 'Application funnels, internship metrics, and exports.',
    feature_4_title: 'Access control',
    feature_4_body: 'JWT auth, refresh tokens, and role-protected routes.',
  },
};

export default function LandingPage() {
  const [landingPage, setLandingPage] = useState<CmsPage>(fallbackLanding);

  useEffect(() => {
    let isMounted = true;
    cmsApi
      .get('landing')
      .then((response) => {
        if (isMounted && response.data.data) {
          setLandingPage(response.data.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLandingPage(fallbackLanding);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featureCards = [1, 2, 3, 4].map((index) => ({
    title: landingPage.fields[`feature_${index}_title`] ?? fallbackLanding.fields[`feature_${index}_title`],
    body: landingPage.fields[`feature_${index}_body`] ?? fallbackLanding.fields[`feature_${index}_body`],
  }));

  const ctaBase =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20';

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-3xl p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-200">
            <Sparkles size={14} />
            Internship & job management
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-ink-950 sm:text-6xl dark:text-white">
            {landingPage.fields.hero_title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink-600 dark:text-ink-300">
            {landingPage.fields.hero_description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className={`${ctaBase} border border-sky-500/15 bg-sky-500/15 text-sky-950 shadow-[0_10px_24px_-10px_rgba(14,165,233,0.22)] hover:translate-y-[-1px] hover:bg-sky-500/22 dark:border-sky-400/15 dark:bg-sky-400/12 dark:text-white`}
            >
              {landingPage.fields.primary_cta}
              <ArrowRight size={16} />
            </Link>
            <div className={`${ctaBase} cursor-default border border-sky-500/12 bg-sky-500/8 text-sky-700 dark:text-sky-200 dark:border-sky-400/10`}>
              {landingPage.fields.secondary_cta}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              ['Students', GraduationCap],
              ['Recruiters', BriefcaseBusiness],
              ['Admins', Users],
            ].map(([label, Icon]) => (
              <span
                key={label as string}
                className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-black/[0.03] px-3 py-1.5 text-sm text-ink-700 dark:border-white/8 dark:bg-white/[0.04] dark:text-ink-200"
              >
                <Icon size={14} />
                {label as string}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['3', 'User roles'],
              ['Live', 'SignalR updates'],
              ['24+', 'Workspace screens'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-2xl font-semibold text-ink-950 dark:text-white">{value}</div>
                <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/12 text-sky-700 dark:text-sky-200">
              <Building2 size={20} />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink-500 dark:text-ink-300">Workspace preview</div>
              <div className="text-lg font-semibold text-ink-950 dark:text-white">What the app feels like after login</div>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              [BriefcaseBusiness, featureCards[0].title, featureCards[0].body],
              [MessageCircleMore, featureCards[1].title, featureCards[1].body],
              [ChartColumnIncreasing, featureCards[2].title, featureCards[2].body],
              [BadgeCheck, featureCards[3].title, featureCards[3].body],
            ].map(([Icon, title, copy]) => (
              <div key={title as string} className="rounded-2xl border border-black/6 bg-white/55 p-4 shadow-[0_12px_30px_-28px_rgba(36,51,79,0.25)] dark:border-white/8 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-200">
                    <Icon size={18} />
                  </span>
                  <span className="font-semibold">{title as string}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">{copy as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-mint-600" />
            <h2 className="text-lg font-semibold">Secure by default</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
            JWT auth, refresh tokens, role-based protection, and audit logs keep the platform presentation-ready.
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <MessageCircleMore size={18} className="text-sky-600" />
            <h2 className="text-lg font-semibold">Realtime collaboration</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
            Live notifications and chat make the workflow feel active instead of static.
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">Built for the full flow</div>
            <h2 className="mt-2 text-xl font-semibold text-ink-950 dark:text-white">Students, recruiters, and admins in one place</h2>
          </div>
          <div className="text-sm text-ink-600 dark:text-ink-300">A cleaner first impression before login.</div>
        </div>
      </section>
    </div>
  );
}
