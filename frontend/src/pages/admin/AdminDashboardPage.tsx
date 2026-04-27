import { DashboardHome } from '@/pages/shared/DashboardHome';
import { AdminRecruiterRequestsPanel } from '@/components/AdminRecruiterRequestsPanel';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-5">
      <DashboardHome role="Admin" title="Admin dashboard" description="Monitor growth, governance, reporting activity, and system-wide operations." />
      <AdminRecruiterRequestsPanel />
    </div>
  );
}
