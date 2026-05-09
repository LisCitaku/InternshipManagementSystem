import type { Role, User } from '@/types';

type ApiRole = Role | 'Company';

export const normalizeRole = (role: string): Role => {
  if (role === 'Company' || role === 'Recruiter') {
    return 'Recruiter';
  }

  if (role === 'Admin') {
    return 'Admin';
  }

  return 'Student';
};

export const toApiRole = (role: Role): ApiRole => (role === 'Recruiter' ? 'Company' : role);

export const getRoleLabel = (role: string) => normalizeRole(role);

export const normalizeUser = <T extends Omit<User, 'roles'> & { roles: string[] }>(user: T): User => ({
  ...user,
  roles: user.roles.map(normalizeRole),
});
