import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { applicationsApi } from '@/api/applicationsApi';
import { usersApi } from '@/api/usersApi';
import { internshipsApi } from '@/api/internshipsApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';
import type { ApplicationItem, Internship } from '@/types';
import { cn } from '@/utils/cn';
import { getOpportunityCapacityLabel, isOpportunityOpen } from '@/utils/internshipCapacity';
import { type SavedJobFilter, storage } from '@/utils/storage';

const internshipStatusLabel: Record<string, string> = {
  '1': 'Draft',
  '2': 'Published',
  '3': 'Closed',
  '4': 'Archived',
  Draft: 'Draft',
  Published: 'Published',
  Closed: 'Closed',
  Archived: 'Archived',
};

export default function StudentSavedJobsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [university, setUniversity] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [savedFilters, setSavedFilters] = useState<SavedJobFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSavedFilters(storage.getSavedJobFilters());
  }, []);

  const loadInternships = () => {
    setLoading(true);
    void internshipsApi.list({
      pageNumber: 1,
      pageSize: 100,
      search: search || undefined,
    }).then((response) => {
      setInternships(response.data.data?.items ?? []);
    }).finally(() => {
      setLoading(false);
    });
  };

  const loadApplications = () => {
    void applicationsApi.mine({ pageNumber: 1, pageSize: 200 }).then((response) => {
      setApplications(response.data.data?.items ?? []);
    });
  };

  useEffect(() => {
    void usersApi.getCurrentProfile().then((response) => {
      const profile = response.data.data ?? null;
      setPhoneNumber(profile?.phoneNumber ?? '');
      setResumeUrl(profile?.cvUrl ?? '');
      setUniversity(profile?.university ?? '');
      setFieldOfStudy(profile?.fieldOfStudy ?? '');
    });

    loadApplications();
  }, []);

  useEffect(() => {
    loadInternships();
  }, [search]);

  useEffect(() => {
    storage.setSavedJobFilters(savedFilters);
  }, [savedFilters]);

  useEffect(() => {
    const refreshInternships = () => loadInternships();
    const refreshApplications = () => loadApplications();

    window.addEventListener('internships.updated', refreshInternships as EventListener);
    window.addEventListener('applications.updated', refreshApplications as EventListener);

    return () => {
      window.removeEventListener('internships.updated', refreshInternships as EventListener);
      window.removeEventListener('applications.updated', refreshApplications as EventListener);
    };
  }, [search]);

  const rows = internships.filter((item) => (location === 'all' || item.location.includes(location)) && isOpportunityOpen(item));
  const featuredCount = rows.filter((item) => item.status === 'Published').length;
  const appliedInternshipIds = new Set(applications.map((item) => item.internshipId));
  const selectedAlreadyApplied = selectedInternship ? appliedInternshipIds.has(selectedInternship.id) : false;
  const currentFilterLabel = useMemo(() => {
    const parts = [search.trim() || 'All internships', location !== 'all' ? location : 'All locations'];
    return parts.join(' • ');
  }, [location, search]);

  const saveCurrentFilter = () => {
    const key = `${search.trim().toLowerCase()}|${location}`;
    if (!search.trim() && location === 'all') {
      toast.info('Search or choose a location first.');
      return;
    }

    setSavedFilters((current) => {
      const next = [
        {
          id: key,
          label: currentFilterLabel,
          search,
          location,
          savedAt: new Date().toISOString(),
        },
        ...current.filter((item) => item.id !== key),
      ].slice(0, 6);

      return next;
    });
    toast.success('Filter saved.');
  };

  const applySavedFilter = (filter: SavedJobFilter) => {
    setSearch(filter.search);
    setLocation(filter.location);
    toast.success(`Applied "${filter.label}".`);
  };

  const removeSavedFilter = (id: string) => {
    setSavedFilters((current) => current.filter((item) => item.id !== id));
  };

  const submitApplication = async () => {
    if (!selectedInternship || !isOpportunityOpen(selectedInternship)) {
      toast.error('This opportunity is full or closed.');
      return;
    }

    setSubmitting(true);
    try {
      const applicationDetails = { coverLetter, phoneNumber, university, fieldOfStudy, portfolioUrl, githubUrl };

      await applicationsApi.create({
        internshipId: selectedInternship.id,
        coverLetter: JSON.stringify(applicationDetails),
        resumeUrl: resumeUrl || undefined,
        phoneNumber: phoneNumber || undefined,
        university: university || undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        portfolioUrl: portfolioUrl || undefined,
        githubUrl: githubUrl || undefined,
      });

      toast.success('Application submitted.');
      loadApplications();
      setSelectedInternship(null);
      setCoverLetter('');
      setPortfolioUrl('');
      setGithubUrl('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TablePage
        title="Find internships"
        description="Search live opportunities and apply directly from your student workspace."
        search={search}
        onSearchChange={setSearch}
        filterValue={location}
        onFilterChange={setLocation}
        filterOptions={[
          { label: 'All locations', value: 'all' },
          { label: 'Remote', value: 'Remote' },
          { label: 'Tirane', value: 'Tirane' },
          { label: 'Prishtine', value: 'Prishtine' },
        ]}
        table={
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-black/6 bg-white/45 p-4 dark:border-white/8 dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-300">Saved searches</div>
                <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">{currentFilterLabel}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={saveCurrentFilter}>
                  Save filter
                </Button>
                <Button variant="ghost" onClick={() => {
                  setSearch('');
                  setLocation('all');
                }}>
                  Reset
                </Button>
              </div>
            </div>

            {savedFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className={cn(
                      'flex items-center gap-2 rounded-full border border-black/6 bg-black/[0.03] px-3 py-2 text-sm dark:border-white/8 dark:bg-white/[0.04]',
                    )}
                  >
                    <button type="button" onClick={() => applySavedFilter(filter)} className="font-medium text-ink-950 dark:text-white">
                      {filter.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedFilter(filter.id)}
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500 transition hover:text-coral-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Open roles', rows.length],
                ['Published', featuredCount],
                ['Locations', new Set(rows.map((item) => item.location)).size],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
                </div>
              ))}
            </div>
            {loading ? (
              <Loader label="Loading internships..." />
            ) : (
              <Table
                data={rows}
                columns={[
                  { key: 'title', header: 'Role' },
                  {
                    key: 'company',
                    header: 'Company',
                    render: (row) =>
                      row.company?.id ? (
                        <Link
                          to={`/companies/${row.company.id}`}
                          className="font-medium text-sky-600 transition hover:text-sky-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
                        >
                          {row.company.name}
                        </Link>
                      ) : (
                        '-'
                      ),
                  },
                  { key: 'location', header: 'Location' },
                  { key: 'category', header: 'Category', render: (row) => row.category || '-' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => (
                      <div className="space-y-1">
                        <div>{internshipStatusLabel[row.status] ?? row.status}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-300">{getOpportunityCapacityLabel(row)}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <Button variant="secondary" onClick={() => setSelectedInternship(row)} disabled={appliedInternshipIds.has(row.id)}>
                        {appliedInternshipIds.has(row.id) ? 'Applied' : 'Apply'}
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </div>
        }
      />

      <Modal open={Boolean(selectedInternship)} title="Apply to internship" onClose={() => setSelectedInternship(null)}>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-black/6 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_18px_45px_-28px_rgba(36,51,79,0.18)] dark:border-white/8 dark:from-white/[0.03] dark:to-white/[0.02]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {selectedInternship?.company.id ? (
                    <Link
                      to={`/companies/${selectedInternship.company.id}`}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 transition hover:text-sky-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      {selectedInternship.company.name}
                    </Link>
                  ) : (
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
                      {selectedInternship?.company.name}
                    </div>
                  )}
                  <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{selectedInternship?.title}</div>
                </div>
                <div className="rounded-full border border-mint-400/20 bg-mint-500/10 px-3 py-1 text-xs font-semibold text-mint-700 dark:text-mint-200">
                  {selectedAlreadyApplied ? 'Applied' : selectedInternship ? getOpportunityCapacityLabel(selectedInternship) : 'Open'}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-600 dark:text-ink-300">{selectedInternship?.description}</p>
            </div>

            {selectedInternship ? (
              <div
                className={cn(
                  'rounded-2xl border p-4 text-sm font-medium',
                  isOpportunityOpen(selectedInternship)
                    ? 'border-mint-400/20 bg-mint-500/10 text-mint-700 dark:text-mint-200'
                    : 'border-coral-400/20 bg-coral-500/10 text-coral-700 dark:text-coral-200',
                )}
              >
                {getOpportunityCapacityLabel(selectedInternship)}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Location', selectedInternship?.location ?? '—'],
                ['Category', selectedInternship?.category ?? '—'],
                ['Type', selectedInternship?.type ?? '—'],
                ['Deadline', selectedInternship?.deadlineAt ? new Date(selectedInternship.deadlineAt).toLocaleDateString() : '—'],
                ['Salary', `${selectedInternship?.salaryMin ?? '—'} - ${selectedInternship?.salaryMax ?? '—'}`],
                ['Status', selectedInternship ? (internshipStatusLabel[selectedInternship.status] ?? selectedInternship.status) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-black/6 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-300">{label}</div>
                  <div className="mt-2 text-sm font-semibold text-ink-950 dark:text-white">{value as string}</div>
                </div>
              ))}
            </div>

            {selectedInternship && !isOpportunityOpen(selectedInternship) ? (
              <div className="rounded-2xl border border-coral-400/20 bg-coral-500/10 p-4 text-sm text-coral-700 dark:text-coral-200">
                This opportunity is full or closed.
              </div>
            ) : selectedAlreadyApplied ? (
              <div className="rounded-2xl border border-mint-400/20 bg-mint-500/10 p-4 text-sm text-mint-700 dark:text-mint-200">
                You already applied to this internship.
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-3xl border border-black/6 bg-[#0f1a2b] p-5 text-white shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)] dark:border-white/8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Application form</div>
              <p className="mt-2 text-sm leading-6 text-white/72">Add the details that help the recruiter evaluate your fit quickly.</p>
            </div>

            <div className="space-y-3">
              <Input label="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+355..." />
              <Input label="University" value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="University name" />
              <Input label="Field of study" value={fieldOfStudy} onChange={(event) => setFieldOfStudy(event.target.value)} placeholder="Computer Science" />
              <Input label="Portfolio URL" type="url" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://..." />
              <Input label="GitHub URL" type="url" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/..." />
            </div>

            <label className="flex flex-col gap-2 text-sm text-white/80">
              <span className="font-medium">Cover letter</span>
              <textarea
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                rows={6}
                placeholder="Short note for the recruiter"
                className="rounded-2xl border border-white/10 bg-[#0b1422] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10"
              />
            </label>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={() => setSelectedInternship(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitApplication()}
                disabled={submitting || selectedAlreadyApplied || (selectedInternship ? !isOpportunityOpen(selectedInternship) : false)}
              >
                {selectedAlreadyApplied ? 'Applied' : submitting ? 'Submitting...' : 'Submit application'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
