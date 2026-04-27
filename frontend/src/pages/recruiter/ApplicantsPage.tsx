import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { applicationsApi, type ApplicationStatus } from '@/api/applicationsApi';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';
import type { ApplicationItem } from '@/types';

const statuses: ApplicationStatus[] = ['Submitted', 'In Review', 'Interview', 'Accepted', 'Rejected'];

const parseApplicationDetails = (coverLetter?: string | null) => {
  if (!coverLetter) return null;

  try {
    const parsed = JSON.parse(coverLetter) as Record<string, string>;
    return {
      phoneNumber: parsed.phoneNumber ?? '',
      university: parsed.university ?? '',
      fieldOfStudy: parsed.fieldOfStudy ?? '',
      portfolioUrl: parsed.portfolioUrl ?? '',
      githubUrl: parsed.githubUrl ?? '',
      coverLetter: parsed.coverLetter ?? '',
      rawCoverLetter: coverLetter,
    };
  } catch {
    return {
      phoneNumber: '',
      university: '',
      fieldOfStudy: '',
      portfolioUrl: '',
      githubUrl: '',
      coverLetter,
      rawCoverLetter: coverLetter,
    };
  }
};

const getApplicantScore = (application: ApplicationItem) => {
  const details = parseApplicationDetails(application.coverLetter);
  let score = 0;
  let maxScore = 0;

  const add = (condition: boolean, points: number) => {
    maxScore += points;
    if (condition) score += points;
  };

  add(Boolean(application.resumeUrl), 25);
  add(Boolean(details?.phoneNumber), 10);
  add(Boolean(details?.university), 15);
  add(Boolean(details?.fieldOfStudy), 15);
  add(Boolean(details?.portfolioUrl), 15);
  add(Boolean(details?.githubUrl), 15);
  add(Boolean(details?.coverLetter && details.coverLetter.trim().length >= 80), 10);

  const normalized = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const label = normalized >= 80 ? 'Strong match' : normalized >= 55 ? 'Good fit' : normalized >= 30 ? 'Needs review' : 'Light profile';
  return { score: normalized, label };
};

export default function ApplicantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);

  useEffect(() => {
    const loadApplicants = async () => {
      setLoading(true);
      try {
        const response = await applicationsApi.list({
          pageNumber: 1,
          pageSize: 100,
          search: search || undefined,
          descending: true,
        });
        setRows(response.data.data?.items ?? []);
      } finally {
        setLoading(false);
      }
    };

    void loadApplicants();
  }, [search]);

  useEffect(() => {
    const refreshApplicants = () => {
      void applicationsApi.list({
        pageNumber: 1,
        pageSize: 100,
        search: search || undefined,
        descending: true,
      }).then((response) => {
        setRows(response.data.data?.items ?? []);
      });
    };

    window.addEventListener('applications.updated', refreshApplicants as EventListener);
    window.addEventListener('application.submitted', refreshApplicants as EventListener);

    return () => {
      window.removeEventListener('applications.updated', refreshApplicants as EventListener);
      window.removeEventListener('application.submitted', refreshApplicants as EventListener);
    };
  }, [search]);

  const filteredRows = rows.filter((item) => status === 'all' || item.status === status);
  const inReviewCount = rows.filter((item) => item.status === 'In Review').length;
  const selectedDetails = parseApplicationDetails(selectedApplication?.coverLetter);
  const applicantScore = selectedApplication ? getApplicantScore(selectedApplication) : null;

  const handleStatusChange = async (applicationId: string, nextStatus: ApplicationStatus) => {
    const response = await applicationsApi.updateStatus(applicationId, nextStatus);
    const updated = response.data.data;
    if (updated) {
      setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Application status updated.');
    }
  };

  return (
    <>
      <TablePage
        title="Applicants"
        description="Search and filter the applicant pipeline across active openings."
        search={search}
        onSearchChange={setSearch}
        filterValue={status}
        onFilterChange={setStatus}
        filterOptions={[
          { label: 'All statuses', value: 'all' },
          { label: 'Submitted', value: 'Submitted' },
          { label: 'In Review', value: 'In Review' },
          { label: 'Interview', value: 'Interview' },
          { label: 'Accepted', value: 'Accepted' },
          { label: 'Rejected', value: 'Rejected' },
        ]}
        table={
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Applications', rows.length],
                ['In review', inReviewCount],
                ['Visible results', filteredRows.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
                </div>
              ))}
            </div>
            {loading ? (
              <Loader label="Loading applicants..." />
            ) : (
              <Table
                data={filteredRows}
                columns={[
                  { key: 'applicantName', header: 'Applicant' },
                  { key: 'internshipTitle', header: 'Position' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-2xl border border-black/8 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-[#0f1a2b] dark:text-white"
                          value={row.status}
                          onChange={(event) => void handleStatusChange(row.id, event.target.value as ApplicationStatus)}
                        >
                          {statuses.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <Button variant="secondary" onClick={() => setSelectedApplication(row)}>
                          View
                        </Button>
                      </div>
                    ),
                  },
                  { key: 'createdAt', header: 'Applied at', render: (row) => new Date(row.createdAt).toLocaleDateString() },
                ]}
              />
            )}
          </div>
        }
      />

      <Modal open={Boolean(selectedApplication)} title="Applicant details" onClose={() => setSelectedApplication(null)}>
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/6 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">Applicant</div>
            <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{selectedApplication?.applicantName}</div>
            <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">{selectedApplication?.internshipTitle}</div>
            {applicantScore ? (
              <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Applicant score</div>
                    <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">{applicantScore.label}</div>
                  </div>
                  <div className="text-3xl font-semibold text-sky-700 dark:text-sky-300">{applicantScore.score}%</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                    style={{ width: `${applicantScore.score}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/6 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-300">Status</div>
              <div className="mt-2 text-sm font-semibold text-ink-950 dark:text-white">{selectedApplication?.status}</div>
            </div>
            <div className="rounded-2xl border border-black/6 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-300">Applied at</div>
              <div className="mt-2 text-sm font-semibold text-ink-950 dark:text-white">
                {selectedApplication ? new Date(selectedApplication.createdAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>

          {selectedApplication?.resumeUrl ? (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">CV</div>
              <a className="mt-2 block text-sm font-semibold text-sky-700 underline dark:text-sky-300" href={selectedApplication.resumeUrl} target="_blank" rel="noreferrer">
                Open CV
              </a>
            </div>
          ) : null}

          {selectedDetails ? (
            <div className="rounded-2xl border border-black/6 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-300">Application info</div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-ink-500 dark:text-ink-300">Phone:</span> {selectedDetails.phoneNumber ?? '—'}</div>
                <div><span className="text-ink-500 dark:text-ink-300">University:</span> {selectedDetails.university ?? '—'}</div>
                <div><span className="text-ink-500 dark:text-ink-300">Field:</span> {selectedDetails.fieldOfStudy ?? '—'}</div>
                <div><span className="text-ink-500 dark:text-ink-300">Portfolio:</span> {selectedDetails.portfolioUrl ? <a href={selectedDetails.portfolioUrl} target="_blank" rel="noreferrer" className="text-sky-600 underline dark:text-sky-300">Open</a> : '—'}</div>
                <div><span className="text-ink-500 dark:text-ink-300">GitHub:</span> {selectedDetails.githubUrl ? <a href={selectedDetails.githubUrl} target="_blank" rel="noreferrer" className="text-sky-600 underline dark:text-sky-300">Open</a> : '—'}</div>
                <div><span className="text-ink-500 dark:text-ink-300">CV:</span> {selectedApplication?.resumeUrl ? <a href={selectedApplication.resumeUrl} target="_blank" rel="noreferrer" className="text-sky-600 underline dark:text-sky-300">Open</a> : '—'}</div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-700 dark:text-ink-200">
                {selectedDetails.coverLetter ?? '—'}
              </p>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => setSelectedApplication(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
