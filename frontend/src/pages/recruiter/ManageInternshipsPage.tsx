import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { internshipsApi } from '@/api/internshipsApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';
import type { Internship } from '@/types';
import { getOpportunityCapacityLabel, getPositionsLeft } from '@/utils/internshipCapacity';

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

export default function ManageInternshipsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [maxApplicants, setMaxApplicants] = useState('1');
  const [savingCapacity, setSavingCapacity] = useState(false);

  useEffect(() => {
    const loadInternships = async () => {
      setLoading(true);
      try {
        const response = await internshipsApi.list({
          pageNumber: 1,
          pageSize: 100,
          search: search || undefined,
          includeInactive: true,
          descending: true,
        });
        setRows(response.data.data?.items ?? []);
      } finally {
        setLoading(false);
      }
    };

    void loadInternships();
  }, [search]);

  useEffect(() => {
    const refreshInternships = () => {
      void internshipsApi.list({
        pageNumber: 1,
        pageSize: 100,
        search: search || undefined,
        includeInactive: true,
        descending: true,
      }).then((response) => {
        setRows(response.data.data?.items ?? []);
      });
    };

    window.addEventListener('workspace.updated', refreshInternships as EventListener);
    window.addEventListener('internships.updated', refreshInternships as EventListener);

    return () => {
      window.removeEventListener('workspace.updated', refreshInternships as EventListener);
      window.removeEventListener('internships.updated', refreshInternships as EventListener);
    };
  }, [search]);

  const filteredRows = rows.filter((item) => status === 'all' || item.status === status);
  const publishedCount = rows.filter((item) => item.status === 'Published').length;

  const openCapacityEditor = (internship: Internship) => {
    setEditingInternship(internship);
    setMaxApplicants(String(internship.maxApplicants));
  };

  const saveCapacity = async () => {
    if (!editingInternship) return;

    const parsed = Number(maxApplicants);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error('Positions available must be at least 1.');
      return;
    }

    setSavingCapacity(true);
    try {
      const response = await internshipsApi.updateCapacity(editingInternship.id, { maxApplicants: parsed });
      const updated = response.data.data;
      if (updated) {
        setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      toast.success('Capacity updated.');
      setEditingInternship(null);
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this internship?')) return;
    await internshipsApi.delete(id);
    toast.success('Internship deleted.');
    setRows((current) => current.filter((item) => item.id !== id));
  };

  return (
    <>
      <TablePage
      title="Manage internships"
      description="Review published listings, search quickly, and keep the pipeline healthy."
      search={search}
      onSearchChange={setSearch}
      filterValue={status}
      onFilterChange={setStatus}
      filterOptions={[
        { label: 'All statuses', value: 'all' },
        { label: 'Published', value: 'Published' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Closed', value: 'Closed' },
      ]}
      action={
        <Link to="/recruiter/create-internship">
          <Button>
            <Plus size={16} />
            New internship
          </Button>
        </Link>
      }
      table={
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['All internships', rows.length],
              ['Published', publishedCount],
              ['Visible results', filteredRows.length],
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
              data={filteredRows}
              columns={[
                { key: 'title', header: 'Role' },
                { key: 'company', header: 'Company', render: (row) => row.company?.name || '-' },
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
                  key: 'capacity',
                  header: 'Capacity',
                  render: (row) => (
                    <div className="text-sm text-ink-700 dark:text-ink-200">
                      {row.currentApplicants}/{row.maxApplicants}
                      <div className="text-xs text-ink-500 dark:text-ink-300">{getPositionsLeft(row)} left</div>
                    </div>
                  ),
                },
                {
                  key: 'deadlineAt',
                  header: 'Deadline',
                  render: (row) => (row.deadlineAt ? new Date(row.deadlineAt).toLocaleDateString() : '-'),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openCapacityEditor(row)}>
                        {row.status === 'Closed' || getPositionsLeft(row) === 0 ? 'Reopen' : 'Edit seats'}
                      </Button>
                      <Button variant="ghost" onClick={() => void handleDelete(row.id)}>
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      }
      />

      <Modal open={Boolean(editingInternship)} title="Update capacity" onClose={() => setEditingInternship(null)}>
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/6 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">Opportunity</div>
            <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{editingInternship?.title}</div>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
              {editingInternship ? getOpportunityCapacityLabel(editingInternship) : ''}
            </p>
          </div>

          <Input
            label="Positions available"
            type="number"
            min={1}
            value={maxApplicants}
            onChange={(event) => setMaxApplicants(event.target.value)}
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setEditingInternship(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveCapacity()} disabled={savingCapacity}>
              {savingCapacity ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
