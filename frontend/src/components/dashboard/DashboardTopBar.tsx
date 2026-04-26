import type { NotificationItem, Role } from '@/types';
import { Bell, BellRing, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DashboardTopBarProps {
  role: Role;
  fullName: string;
  unreadCount: number;
  notificationsOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: NotificationItem[];
  onToggleNotifications: () => void;
  onToggleMobileMenu: () => void;
  onNotificationClick: (notification: NotificationItem) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
}

export function DashboardTopBar({
  role,
  fullName,
  unreadCount,
  notificationsOpen,
  mobileMenuOpen,
  notifications,
  onToggleNotifications,
  onToggleMobileMenu,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAll,
}: DashboardTopBarProps) {
  return (
    <header className="relative z-30 flex flex-col gap-4 overflow-visible rounded-2xl border border-black/6 bg-gradient-to-r from-white/85 via-white/72 to-sky-50/55 px-5 py-4 shadow-[0_18px_50px_-30px_rgba(36,51,79,0.18)] backdrop-blur dark:border-white/8 dark:from-white/[0.04] dark:via-white/[0.03] dark:to-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-mint-600 dark:text-mint-300">Workspace</div>
        <div className="mt-1 truncate text-xl font-semibold tracking-tight text-ink-950 dark:text-white">
          Welcome back, {fullName}
        </div>
        <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
          {role} dashboard for day-to-day work, alerts, and quick actions.
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleNotifications}
          className={cn(
            'relative inline-flex h-11 w-11 items-center justify-center rounded-full border text-ink-700 transition hover:bg-sky-500/10 dark:text-white',
            'border-black/8 bg-white/90 dark:border-white/10 dark:bg-white/6',
          )}
          aria-label="Open notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[11px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>

        <span className="hidden rounded-full border border-black/8 bg-white/80 px-3 py-2 text-xs font-semibold text-ink-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 sm:inline-flex">
          {role}
        </span>

        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/90 text-ink-700 dark:border-white/10 dark:bg-white/6 dark:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {notificationsOpen ? (
          <div className="fixed right-4 top-24 z-[90] w-[min(380px,calc(100vw-2rem))] rounded-3xl border border-sky-400/20 bg-[#0d1727] p-3 text-white shadow-[0_30px_90px_-35px_rgba(0,0,0,0.78)] ring-1 ring-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between px-2 pb-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Notifications</div>
                <div className="text-sm text-white/70">{unreadCount} unread</div>
              </div>
              <BellRing size={18} className="text-sky-200" />
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-5 text-sm text-white/70">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNotificationClick(item)}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-3 text-left transition hover:bg-white/8',
                      item.isRead ? 'border-white/8 bg-white/5' : 'border-sky-400/20 bg-sky-500/10',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-xs leading-5 text-white/65">{item.body}</div>
                      </div>
                      {!item.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" /> : null}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/40">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/12"
              >
                Mark all as read
              </button>
              <button
                type="button"
                onClick={onViewAll}
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/12"
              >
                View all
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
