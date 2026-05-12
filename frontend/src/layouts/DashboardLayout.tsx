import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, BriefcaseBusiness, Database, FileBarChart2, LayoutDashboard, LogOut, MessageSquare, Search, Shield, Upload, UserRound } from 'lucide-react';
import { fetchNotifications } from '@/store/slices/notificationsSlice';
import { notificationMarkedAsRead, notificationsMarkedAllAsRead } from '@/store/slices/notificationsSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { logout } from '@/store/slices/authSlice';
import { notificationsApi } from '@/api/notificationsApi';
import { StudentHelperBot } from '@/components/StudentHelperBot';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { useSignalR } from '@/hooks/useSignalR';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

const navItems: Record<Role, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  Student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Profile', icon: UserRound },
    { to: '/student/applications', label: 'My applications', icon: BriefcaseBusiness },
    { to: '/student/saved-jobs', label: 'Opportunities', icon: Search },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/chat', label: 'Chat', icon: MessageSquare },
  ],
  Recruiter: [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/company-profile', label: 'Company profile', icon: UserRound },
    { to: '/recruiter/create-internship', label: 'Create internship', icon: BriefcaseBusiness },
    { to: '/recruiter/manage-internships', label: 'Manage internships', icon: Search },
    { to: '/recruiter/applicants', label: 'Applicants', icon: Bell },
    { to: '/recruiter/chat', label: 'Chat', icon: MessageSquare },
  ],
  Admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: UserRound },
    { to: '/admin/roles', label: 'Roles', icon: Shield },
    { to: '/admin/permissions', label: 'Permissions', icon: Shield },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart2 },
    { to: '/admin/settings', label: 'CMS', icon: Database },
    { to: '/admin/data', label: 'Data exchange', icon: Upload },
    { to: '/admin/audit-logs', label: 'Audit logs', icon: Bell },
  ],
};

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAppSelector((state) => state.auth.session);
  const notifications = useAppSelector((state) => state.notifications.items);
  const primaryRole = (session?.user.roles[0] ?? 'Student') as Role;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useSignalR();

  useEffect(() => {
    void dispatch(fetchNotifications());
  }, [dispatch]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  const handleNotificationClick = async (notificationId: string, title: string) => {
    await notificationsApi.markAsRead(notificationId);
    dispatch(notificationMarkedAsRead(notificationId));

    if (title.toLowerCase().includes('application received')) {
      navigate('/recruiter/applicants');
      return;
    }
    if (title.toLowerCase().includes('internship published')) {
      navigate('/student/saved-jobs');
      return;
    }
    navigate(primaryRole === 'Admin' ? '/admin/reports' : primaryRole === 'Recruiter' ? '/recruiter/dashboard' : '/student/notifications');
  };

  return (
    <div className="page-shell">
      <div className="app-grid gap-5 px-4 py-4 lg:px-5">
        <aside className={cn(
          'rounded-lg border border-white/8 bg-[#0c1626]/94 p-4 text-white shadow-[0_24px_80px_-30px_rgba(0,0,0,0.7)]',
          'lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:flex-col lg:min-h-0',
          mobileMenuOpen ? 'block' : 'hidden lg:block',
        )}>
          <div className="border-b border-white/8 pb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Workspace</div>
              <div className="mt-1 text-lg font-semibold text-white">Internship Hub</div>
              <div className="mt-1 text-sm leading-6 text-white/55">A focused workspace for students, recruiters, and admins.</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.08] to-white/[0.03] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-300">{primaryRole}</div>
            <div className="mt-2 text-base font-semibold">
              {session?.user.firstName} {session?.user.lastName}
            </div>
            <div className="mt-1 text-sm text-white/68">{session?.user.email}</div>
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <nav className="space-y-1 lg:overflow-y-auto lg:pr-1">
              {navItems[primaryRole].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-sky-500/18 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.22)]'
                        : 'text-white/72 hover:bg-white/[0.05] hover:text-white',
                    )
                  }
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto pt-4">
              <button
                onClick={() => dispatch(logout())}
                className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-coral-300 transition hover:bg-coral-500/10 hover:text-coral-200"
              >
                <LogOut size={17} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <DashboardTopBar
            role={primaryRole}
            fullName={`${session?.user.firstName ?? ''} ${session?.user.lastName ?? ''}`.trim()}
            unreadCount={unreadCount}
            notificationsOpen={notificationsOpen}
            mobileMenuOpen={mobileMenuOpen}
            notifications={recentNotifications}
            onToggleNotifications={() => setNotificationsOpen((value) => !value)}
            onToggleMobileMenu={() => setMobileMenuOpen((value) => !value)}
            onNotificationClick={(item) => {
              setNotificationsOpen(false);
              void handleNotificationClick(item.id, item.title);
            }}
            onMarkAllAsRead={() => {
              setNotificationsOpen(false);
              void notificationsApi.markAllAsRead().then(() => {
                dispatch(notificationsMarkedAllAsRead());
              });
            }}
            onViewAll={() => {
              setNotificationsOpen(false);
              navigate(primaryRole === 'Recruiter' ? '/recruiter/applicants' : primaryRole === 'Admin' ? '/admin/dashboard' : '/student/notifications');
            }}
          />

          <Outlet />
        </div>
      </div>
      <StudentHelperBot />
    </div>
  );
}
