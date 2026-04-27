import { useEffect, useMemo, useState } from 'react';
import { usersApi } from '@/api/usersApi';
import { Loader } from '@/components/Loader';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';

export default function RolesPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<{ id: string; roles: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getUsers({ pageNumber: 1, pageSize: 500 });
      setUsers(response.data.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    const refresh = () => void loadRoles();
    window.addEventListener('dashboard.updated', refresh as EventListener);
    window.addEventListener('workspace.updated', refresh as EventListener);
    return () => {
      window.removeEventListener('dashboard.updated', refresh as EventListener);
      window.removeEventListener('workspace.updated', refresh as EventListener);
    };
  }, []);

  const roles = useMemo(() => {
    const counts = users.reduce<Record<string, number>>((accumulator, user) => {
      const role = user.roles[0] ?? 'Student';
      accumulator[role] = (accumulator[role] ?? 0) + 1;
      return accumulator;
    }, {});

    return [
      { role: 'Admin', users: counts.Admin ?? 0, scope: 'Global' },
      { role: 'Recruiter', users: counts.Recruiter ?? 0, scope: 'Company' },
      { role: 'Student', users: counts.Student ?? 0, scope: 'Self-service' },
    ];
  }, [users]);

  const filteredRoles = roles.filter((item) => item.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <TablePage
      title="Roles"
      description="Role-based navigation and permissions map directly to backend authorization."
      search={search}
      onSearchChange={setSearch}
      filterValue="all"
      onFilterChange={() => undefined}
      filterOptions={[{ label: 'All scopes', value: 'all' }]}
      table={
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Roles', roles.length],
              ['Visible results', filteredRoles.length],
              ['Global scope', roles.filter((item) => item.scope === 'Global').length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
              </div>
            ))}
          </div>
          {loading ? (
            <Loader label="Loading roles..." />
          ) : (
            <Table data={filteredRoles} columns={[{ key: 'role', header: 'Role' }, { key: 'users', header: 'Assigned users' }, { key: 'scope', header: 'Scope' }]} />
          )}
        </div>
      }
    />
  );
}
