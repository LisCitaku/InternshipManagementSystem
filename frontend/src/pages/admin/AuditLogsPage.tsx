import { useState } from 'react';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';

const rows = [
  { actor: 'admin@ijmp.dev', action: 'Updated permissions', entity: 'RolePermissions', timestamp: '2026-05-17 12:14' },
  { actor: 'recruiter@northstar.dev', action: 'Published internship', entity: 'Internships', timestamp: '2026-05-17 10:20' },
  { actor: 'student1@example.com', action: 'Submitted application', entity: 'Applications', timestamp: '2026-05-16 18:42' },
];

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const filteredRows = rows.filter(
    (item) => item.entity.toLowerCase().includes(search.toLowerCase()) || item.actor.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <TablePage
      title="Audit logs"
      description="A UI surface for the backend audit trail, optimized for scanning operational history."
      search={search}
      onSearchChange={setSearch}
      filterValue="all"
      onFilterChange={() => undefined}
      filterOptions={[{ label: 'All entities', value: 'all' }]}
      table={
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Audit events', rows.length],
              ['Visible results', filteredRows.length],
              ['Unique entities', new Set(rows.map((item) => item.entity)).size],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
              </div>
            ))}
          </div>
          <Table data={filteredRows} columns={[{ key: 'actor', header: 'Actor' }, { key: 'action', header: 'Action' }, { key: 'entity', header: 'Entity' }, { key: 'timestamp', header: 'Timestamp' }]} />
        </div>
      }
    />
  );
}
