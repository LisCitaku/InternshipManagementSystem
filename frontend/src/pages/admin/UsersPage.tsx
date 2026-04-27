import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { lookupsApi } from '@/api/lookupsApi';
import { recruiterRequestsApi } from '@/api/recruiterRequestsApi';
import { usersApi } from '@/api/usersApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/Table';
import { TablePage } from '@/pages/shared/TablePage';
import type { Company, Role, User } from '@/types';

const roleOptions: { label: string; value: Role | 'all' }[] = [
  { label: 'All roles', value: 'all' },
  { label: 'Student', value: 'Student' },
  { label: 'Recruiter', value: 'Recruiter' },
  { label: 'Admin', value: 'Admin' },
];

const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phoneNumber: z.string().optional(),
  role: z.enum(['Student', 'Recruiter', 'Admin']),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [linkingCompanyId, setLinkingCompanyId] = useState('');
  const [pendingRecruiterRequestsByUserId, setPendingRecruiterRequestsByUserId] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'Student',
    },
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getUsers({
        pageNumber: 1,
        pageSize: 100,
        search: search || undefined,
        role: role === 'all' ? undefined : role,
      });
      setUsers(response.data.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRecruiters = async () => {
    try {
      const response = await recruiterRequestsApi.list();
      setPendingRecruiterRequestsByUserId(
        Object.fromEntries((response.data.data ?? []).map((request) => [request.userId, request.id])),
      );
    } catch {
      setPendingRecruiterRequestsByUserId({});
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadPendingRecruiters();
  }, [search, role]);

  useEffect(() => {
    const refreshUsers = () => void loadUsers();
    window.addEventListener('workspace.updated', refreshUsers as EventListener);
    window.addEventListener('dashboard.updated', refreshUsers as EventListener);
    window.addEventListener('recruiter.request.submitted', refreshUsers as EventListener);
    return () => {
      window.removeEventListener('workspace.updated', refreshUsers as EventListener);
      window.removeEventListener('dashboard.updated', refreshUsers as EventListener);
      window.removeEventListener('recruiter.request.submitted', refreshUsers as EventListener);
    };
  }, [search, role]);

  useEffect(() => {
    const refreshPendingRecruiters = () => void loadPendingRecruiters();
    window.addEventListener('workspace.updated', refreshPendingRecruiters as EventListener);
    window.addEventListener('recruiter.request.submitted', refreshPendingRecruiters as EventListener);
    return () => {
      window.removeEventListener('workspace.updated', refreshPendingRecruiters as EventListener);
      window.removeEventListener('recruiter.request.submitted', refreshPendingRecruiters as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadCompanies = async () => {
      const response = await lookupsApi.companies();
      setCompanies(response.data.data?.items ?? []);
    };
    void loadCompanies();
  }, []);

  const rows = useMemo(() => users, [users]);
  const activeUsers = users.filter((user) => user.isActive).length;
  const roleBreakdown = {
    student: users.filter((user) => (user.roles[0] ?? 'Student') === 'Student').length,
    recruiter: users.filter((user) => (user.roles[0] ?? 'Student') === 'Recruiter').length,
    admin: users.filter((user) => (user.roles[0] ?? 'Student') === 'Admin').length,
  };

  const getDisplayRole = (row: User) => {
    if (pendingRecruiterRequestsByUserId[row.id]) {
      return 'Recruiter (Pending)';
    }

    return row.roles[0] ?? 'Student';
  };

  const getDisplayStatus = (row: User) => {
    if (pendingRecruiterRequestsByUserId[row.id]) {
      return 'Pending approval';
    }

    return row.isActive ? 'Active' : 'Inactive';
  };

  const onCreateUser = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await usersApi.createUser(values);
      toast.success('User created successfully.');
      reset({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'Student' });
      setModalOpen(false);
      await loadUsers();
    } finally {
      setSubmitting(false);
    }
  });

  const handleRoleChange = async (userId: string, nextRole: Role) => {
    await usersApi.updateUserRole(userId, nextRole);
    toast.success('User role updated.');
    await loadUsers();
  };

  const handleStatusToggle = async (userId: string, isActive: boolean) => {
    await usersApi.updateUserStatus(userId, isActive);
    toast.success(`User ${isActive ? 'activated' : 'deactivated'}.`);
    await loadUsers();
  };

  const handleApproveRecruiter = async (userId: string) => {
    const requestId = pendingRecruiterRequestsByUserId[userId];
    if (!requestId) return;

    await recruiterRequestsApi.approve(requestId);
    toast.success('Recruiter approved.');
    await Promise.all([loadUsers(), loadPendingRecruiters()]);
  };

  const handleRejectRecruiter = async (userId: string) => {
    const requestId = pendingRecruiterRequestsByUserId[userId];
    if (!requestId) return;

    await recruiterRequestsApi.reject(requestId);
    toast.success('Recruiter rejected.');
    await Promise.all([loadUsers(), loadPendingRecruiters()]);
  };

  const handleLinkCompany = async (userId: string) => {
    if (!linkingCompanyId) return;
    await usersApi.linkCompanyToUser(userId, linkingCompanyId);
    toast.success('Company linked to user.');
    setLinkingCompanyId('');
    await loadUsers();
  };

  return (
    <>
      <TablePage
        title="Users"
        description="Provision recruiter and student accounts, then keep access under admin control."
        search={search}
        onSearchChange={setSearch}
        filterValue={role}
        onFilterChange={(value) => setRole(value as 'all' | Role)}
        filterOptions={roleOptions}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            New user
          </Button>
        }
        table={
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Total users', users.length],
                ['Active users', activeUsers],
                ['Students', roleBreakdown.student],
                ['Recruiters', roleBreakdown.recruiter],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
                  <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as number}</div>
                </div>
              ))}
            </div>
            {loading ? (
              <Loader label="Loading users..." />
            ) : (
              <Table
                data={rows}
                columns={[
                  { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
                  { key: 'email', header: 'Email' },
                  { key: 'phoneNumber', header: 'Phone', render: (row) => row.phoneNumber || '-' },
                  {
                    key: 'role',
                    header: 'Role',
                    render: (row) => {
                      const displayRole = getDisplayRole(row);
                      const canEditRole = !pendingRecruiterRequestsByUserId[row.id];

                      return canEditRole ? (
                        <select
                          className="rounded-2xl border border-black/8 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
                          value={row.roles[0] ?? 'Student'}
                          onChange={(event) => void handleRoleChange(row.id, event.target.value as Role)}
                        >
                          <option value="Student">Student</option>
                          <option value="Recruiter">Recruiter</option>
                          <option value="Admin">Admin</option>
                        </select>
                      ) : (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                          {displayRole}
                        </span>
                      );
                    },
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => (
                      <span
                        className={
                          getDisplayStatus(row) === 'Pending approval'
                            ? 'text-amber-600 dark:text-amber-300'
                            : row.isActive
                              ? 'text-mint-600 dark:text-mint-500'
                              : 'text-coral-500'
                        }
                      >
                        {getDisplayStatus(row)}
                      </span>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <div className="flex flex-wrap items-center gap-2">
                        {pendingRecruiterRequestsByUserId[row.id] ? (
                          <>
                            <Button onClick={() => void handleApproveRecruiter(row.id)}>Approve</Button>
                            <Button variant="ghost" onClick={() => void handleRejectRecruiter(row.id)}>Reject</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="secondary" onClick={() => void handleStatusToggle(row.id, !row.isActive)}>
                              {row.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            {row.roles[0] === 'Recruiter' ? (
                              <>
                                <select
                                  className="rounded-2xl border border-black/8 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
                                  value={linkingCompanyId}
                                  onChange={(event) => setLinkingCompanyId(event.target.value)}
                                >
                                  <option value="">Link company...</option>
                                  {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                      {company.name}
                                    </option>
                                  ))}
                                </select>
                                <Button variant="secondary" onClick={() => void handleLinkCompany(row.id)}>
                                  Link
                                </Button>
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create user">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateUser}>
          <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          <div className="md:col-span-2">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
          <Input label="Phone number" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
          <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200 md:col-span-2">
            <span className="font-medium">Role</span>
            <select
              className="rounded-lg border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/12 dark:border-white/10 dark:bg-white/6"
              {...register('role')}
            >
              <option value="Student">Student</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create user'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
