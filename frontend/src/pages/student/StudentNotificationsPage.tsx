import { useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { toast } from 'react-toastify';
import { notificationsApi } from '@/api/notificationsApi';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { fetchNotifications, notificationMarkedAsRead } from '@/store/slices/notificationsSlice';

export default function StudentNotificationsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.items);
  const unreadNotifications = notifications.filter((item) => !item.isRead);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      dispatch(notificationMarkedAsRead(notificationId));
      toast.success('Notification marked as read.');
    } catch {
      toast.error('Could not mark notification as read.');
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" description="SignalR notifications land here in realtime when the backend pushes them." />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Notifications', notifications.length],
          ['Unread', unreadNotifications.length],
          ['Live feed', 'On'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value as string | number}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {unreadNotifications.length === 0 ? (
          <div className="glass-panel rounded-3xl px-5 py-10 text-center text-sm text-ink-500 dark:text-ink-300">
            No unread notifications right now. Marked items will disappear from this list.
          </div>
        ) : (
          unreadNotifications.map((item) => (
            <article key={item.id} className="glass-panel rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky-500/12 p-3 text-sky-600">
                  <BellRing size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <span className="text-xs text-ink-500">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">{item.body}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => void markAsRead(item.id)}>
                      Mark read
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
