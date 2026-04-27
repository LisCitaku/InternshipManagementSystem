import { useState } from 'react';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';

const permissions = [
  { name: 'ManageUsers', role: 'Admin', area: 'Identity' },
  { name: 'CreateInternship', role: 'Recruiter', area: 'Internships' },
  { name: 'ApplyInternship', role: 'Student', area: 'Applications' },
];

export default function PermissionsPage() {
  const [search, setSearch] = useState('');
  const filteredPermissions = permissions.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <TablePage
      title="Permissions"
      description="Use this screen to present backend authorization concepts in a way admins can reason about."
      search={search}
      onSearchChange={setSearch}
      filterValue="all"
      onFilterChange={() => undefined}
      filterOptions={[{ label: 'All areas', value: 'all' }]}
      table={
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Permissions', permissions.length],
              ['Visible results', filteredPermissions.length],
              ['Unique areas', new Set(permissions.map((item) => item.area)).size],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
              </div>
            ))}
          </div>
          <Table data={filteredPermissions} columns={[{ key: 'name', header: 'Permission' }, { key: 'role', header: 'Role' }, { key: 'area', header: 'Area' }]} />
        </div>
      }
    />
  );
}
