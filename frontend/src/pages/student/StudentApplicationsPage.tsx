import { useEffect, useState } from 'react';
import { applicationsApi } from '@/api/applicationsApi';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';
import type { ApplicationItem } from '@/types';

export default function StudentApplicationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      try {
        const response = await applicationsApi.mine({
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

    void loadApplications();
  }, [search]);

  const filteredRows = rows.filter((item) => status === 'all' || item.status === status);
  const submittedCount = rows.filter((item) => item.status === 'Submitted').length;

  return (
    <TablePage
      title="My applications"
      description="Review application progress, recruiter responses, and interview movement."
      search={search}
      onSearchChange={setSearch}
      filterValue={status}
      onFilterChange={setStatus}
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Submitted', value: 'Submitted' },
        { label: 'In Review', value: 'In Review' },
        { label: 'Interview', value: 'Interview' },
      ]}
      table={
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Applications', rows.length],
              ['Submitted', submittedCount],
              ['Visible results', filteredRows.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
              </div>
            ))}
          </div>
          {loading ? (
            <Loader label="Loading applications..." />
          ) : (
            <Table
              data={filteredRows}
              columns={[
                { key: 'internshipTitle', header: 'Internship' },
                { key: 'status', header: 'Status' },
                { key: 'createdAt', header: 'Applied at', render: (row) => new Date(row.createdAt).toLocaleDateString() },
              ]}
            />
          )}
        </div>
      }
    />
  );
}
