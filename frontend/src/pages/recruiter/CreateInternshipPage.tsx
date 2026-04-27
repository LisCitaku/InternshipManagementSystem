import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { internshipsApi } from '@/api/internshipsApi';
import { lookupsApi } from '@/api/lookupsApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { SectionHeader } from '@/components/SectionHeader';
import type { Category, Company } from '@/types';

const createInternshipSchema = z.object({
  companyId: z.string().min(1, 'Company is required.'),
  categoryId: z.string().min(1, 'Category is required.'),
  title: z.string().min(4, 'Title is too short.'),
  description: z.string().min(20, 'Description should explain the opportunity.'),
  location: z.string().min(2, 'Location is required.'),
  type: z.coerce.number().min(1),
  maxApplicants: z.coerce.number().int().min(1, 'Positions available must be at least 1.'),
  salaryMin: z.preprocess((value) => (value === '' ? undefined : value), z.coerce.number().optional()),
  salaryMax: z.preprocess((value) => (value === '' ? undefined : value), z.coerce.number().optional()),
  deadlineAt: z.string().optional(),
});

type CreateInternshipFormValues = z.input<typeof createInternshipSchema>;
type CreateInternshipValues = z.output<typeof createInternshipSchema>;

export default function CreateInternshipPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInternshipFormValues, unknown, CreateInternshipValues>({
    resolver: zodResolver(createInternshipSchema),
    defaultValues: {
      type: 1,
      maxApplicants: 1,
    },
  });

  const loadLookups = useCallback(async () => {
    setLoadingLookups(true);
    try {
      const [companiesResponse, categoriesResponse] = await Promise.all([lookupsApi.companies(), lookupsApi.categories()]);
      setCompanies(companiesResponse.data.data?.items ?? []);
      setCategories(categoriesResponse.data.data?.items ?? []);
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    const handleWorkspaceUpdate = () => {
      void loadLookups();
    };

    window.addEventListener('workspace.updated', handleWorkspaceUpdate as EventListener);
    window.addEventListener('company-profile-updated', handleWorkspaceUpdate as EventListener);

    return () => {
      window.removeEventListener('workspace.updated', handleWorkspaceUpdate as EventListener);
      window.removeEventListener('company-profile-updated', handleWorkspaceUpdate as EventListener);
    };
  }, [loadLookups]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await internshipsApi.create({
        ...values,
        deadlineAt: values.deadlineAt ? new Date(values.deadlineAt).toISOString() : undefined,
        publishNow: true,
      });
      toast.success('Internship published.');
      navigate('/recruiter/manage-internships');
    } finally {
      setSubmitting(false);
    }
  });

  if (loadingLookups) {
    return <Loader label="Preparing internship form..." />;
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Create internship" description="Publish a structured opportunity that students can discover and apply to." />
      <form className="glass-panel grid gap-4 rounded-3xl p-5 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
          <span className="font-medium">Company</span>
          <select
            className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
            {...register('companyId')}
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          {errors.companyId ? <span className="text-xs text-coral-500">{errors.companyId.message}</span> : null}
        </label>

        <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
          <span className="font-medium">Category</span>
          <select
            className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
            {...register('categoryId')}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <span className="text-xs text-coral-500">{errors.categoryId.message}</span> : null}
        </label>

        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <Input label="Location" error={errors.location?.message} {...register('location')} />
        <Input label="Positions available" type="number" error={errors.maxApplicants?.message} {...register('maxApplicants')} />

        <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
          <span className="font-medium">Type</span>
          <select
            className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
            {...register('type')}
          >
            <option value={1}>Internship</option>
            <option value={2}>Full time</option>
            <option value={3}>Part time</option>
            <option value={4}>Remote</option>
            <option value={5}>Hybrid</option>
          </select>
        </label>

        <Input label="Deadline" type="date" error={errors.deadlineAt?.message} {...register('deadlineAt')} />
        <Input label="Salary min" type="number" error={errors.salaryMin?.message} {...register('salaryMin')} />
        <Input label="Salary max" type="number" error={errors.salaryMax?.message} {...register('salaryMax')} />
        <div className="md:col-span-2">
          <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
            <span className="font-medium">Description</span>
            <textarea
              rows={6}
              placeholder="Explain responsibilities, skills, and expectations."
              className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
              {...register('description')}
            />
            {errors.description ? <span className="text-xs text-coral-500">{errors.description.message}</span> : null}
          </label>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish internship'}
          </Button>
        </div>
      </form>
    </div>
  );
}
