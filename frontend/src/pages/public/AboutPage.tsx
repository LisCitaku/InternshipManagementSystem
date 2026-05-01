import { useEffect, useState } from 'react';
import { BadgeCheck, LayoutDashboard, Users2 } from 'lucide-react';
import { cmsApi } from '@/api/cmsApi';
import type { CmsPage } from '@/types';

const fallbackAbout: CmsPage = {
  pageKey: 'about',
  title: 'About Page',
  description: 'Static about page copy',
  updatedAt: new Date().toISOString(),
  fields: {
    headline: 'Career operations with structure, visibility, and realtime collaboration.',
    body: 'The frontend is organized around scalable feature boundaries: auth, internships, notifications, chat, reporting, and admin tooling.',
    mission: 'Reduce friction between opportunity discovery and application review.',
    vision: 'Provide a clean academic-to-industry bridge with strong security and live collaboration.',
  },
};

export default function AboutPage() {
  const [aboutPage, setAboutPage] = useState<CmsPage>(fallbackAbout);

  useEffect(() => {
    let isMounted = true;
    cmsApi
      .get('about')
      .then((response) => {
        if (isMounted && response.data.data) {
          setAboutPage(response.data.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAboutPage(fallbackAbout);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="glass-panel rounded-3xl p-8 lg:p-10">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-mint-600">About the platform</div>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink-950 dark:text-white">
          {aboutPage.fields.headline}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-ink-600 dark:text-ink-300">{aboutPage.fields.body}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users2 size={16} className="text-sky-600" />
              Mission
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">{aboutPage.fields.mission}</p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-black/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck size={16} className="text-mint-600" />
              Vision
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">{aboutPage.fields.vision}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8 lg:p-10">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={18} className="text-sky-600" />
          <h2 className="text-lg font-semibold">What the platform covers</h2>
        </div>
        <div className="mt-6 space-y-4">
          {[
            ['Frontend', 'Clear dashboards, CMS editing, and polished forms.'],
            ['Backend', 'Layered architecture with secure APIs and realtime services.'],
            ['Database', 'Relational structure with audit, auth, and content tables.'],
          ].map(([label, copy]) => (
            <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">{label}</div>
              <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
