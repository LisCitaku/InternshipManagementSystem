import { useEffect, useMemo, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { cmsApi } from '@/api/cmsApi';
import type { CmsPage } from '@/types';

const cmsSections = [
  {
    key: 'landing',
    label: 'Landing page',
    description: 'Controls the public homepage hero, CTA, and feature highlights.',
    fieldOrder: [
      'hero_title',
      'hero_description',
      'primary_cta',
      'secondary_cta',
      'feature_1_title',
      'feature_1_body',
      'feature_2_title',
      'feature_2_body',
      'feature_3_title',
      'feature_3_body',
      'feature_4_title',
      'feature_4_body',
    ],
  },
  {
    key: 'about',
    label: 'About page',
    description: 'Controls the public about-page messaging and platform positioning.',
    fieldOrder: ['headline', 'body', 'mission', 'vision'],
  },
] as const;

const fieldLabels: Record<string, string> = {
  hero_title: 'Hero title',
  hero_description: 'Hero description',
  primary_cta: 'Primary CTA',
  secondary_cta: 'Secondary CTA',
  feature_1_title: 'Feature 1 title',
  feature_1_body: 'Feature 1 body',
  feature_2_title: 'Feature 2 title',
  feature_2_body: 'Feature 2 body',
  feature_3_title: 'Feature 3 title',
  feature_3_body: 'Feature 3 body',
  feature_4_title: 'Feature 4 title',
  feature_4_body: 'Feature 4 body',
  headline: 'Headline',
  body: 'Body',
  mission: 'Mission',
  vision: 'Vision',
};

function humanizeField(field: string) {
  return fieldLabels[field] ?? field.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function isMultilineField(field: string) {
  return /description|body|vision|mission/i.test(field);
}

function CmsEditor({ page, onSave, saving }: { page: CmsPage; onSave: (page: CmsPage) => void; saving: boolean }) {
  const [draft, setDraft] = useState(page);

  useEffect(() => {
    setDraft(page);
  }, [page]);

  const orderedFields = useMemo(() => {
    const preferredOrder = [...(cmsSections.find((section) => section.key === page.pageKey)?.fieldOrder ?? [])] as string[];
    const entries = Object.entries(draft.fields);
    return entries.sort(([left], [right]) => {
      const leftIndex = preferredOrder.indexOf(left);
      const rightIndex = preferredOrder.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
  }, [draft.fields, page.pageKey]);

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{page.title}</h3>
          <p className="text-sm text-ink-600 dark:text-ink-300">{page.description}</p>
          <div className="mt-2 text-xs uppercase tracking-[0.2em] text-mint-600 dark:text-mint-300">Live CMS content</div>
        </div>
        <Button onClick={() => onSave(draft)} disabled={saving}>
          {saving ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Saving' : 'Save changes'}
        </Button>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
          <span className="font-medium">Page title</span>
          <input
            className="rounded-lg border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/12 dark:border-white/10 dark:bg-white/6"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
          <span className="font-medium">Page description</span>
          <textarea
            className="min-h-28 rounded-lg border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/12 dark:border-white/10 dark:bg-white/6"
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          {orderedFields.map(([field, value]) => (
            <label key={field} className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200 lg:col-span-1">
              <span className="font-medium">{humanizeField(field)}</span>
              {isMultilineField(field) ? (
                <textarea
                  className="min-h-28 rounded-lg border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/12 dark:border-white/10 dark:bg-white/6"
                  value={value}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fields: { ...current.fields, [field]: event.target.value },
                    }))
                  }
                />
              ) : (
                <input
                  className="rounded-lg border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/12 dark:border-white/10 dark:bg-white/6"
                  value={value}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fields: { ...current.fields, [field]: event.target.value },
                    }))
                  }
                />
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all(cmsSections.map((section) => cmsApi.get(section.key).then((response) => response.data.data)))
      .then((results) => {
        if (isMounted) {
          setPages(results);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (pageKey: string, page: CmsPage) => {
    setSavingKey(pageKey);
    try {
      const response = await cmsApi.update(pageKey, {
        title: page.title,
        description: page.description,
        fields: page.fields,
      });
      setPages((current) => current.map((item) => (item.pageKey === pageKey ? response.data.data : item)));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="CMS"
        description="Edit the static public content without touching code or business tables."
      />
      {loading ? (
        <div className="glass-panel rounded-lg p-6 text-sm text-ink-600 dark:text-ink-300">Loading CMS content...</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {cmsSections.map((section) => {
            const page = pages.find((item) => item.pageKey === section.key);
            if (!page) {
              return null;
            }

            return (
              <CmsEditor
                key={page.pageKey}
                page={page}
                saving={savingKey === page.pageKey}
                onSave={(draft) => handleSave(page.pageKey, draft)}
              />
            );
          })}
        </div>
      )}
      <div className="glass-panel rounded-lg p-5 text-sm text-ink-600 dark:text-ink-300">
        CMS data is stored in the `Settings` table with a `cms:` prefix, so it remains separate from business records.
      </div>
    </div>
  );
}
