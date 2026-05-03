import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { recruiterRequestsApi, type RecruiterApprovalRequest } from '@/api/recruiterRequestsApi';
import { Button } from '@/components/Button';

export function AdminRecruiterRequestsPanel() {
  const [requests, setRequests] = useState<RecruiterApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await recruiterRequestsApi.list();
      setRequests(response.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
    const refresh = () => void loadRequests();
    window.addEventListener('workspace.updated', refresh as EventListener);
    window.addEventListener('recruiter.request.submitted', refresh as EventListener);
    return () => {
      window.removeEventListener('workspace.updated', refresh as EventListener);
      window.removeEventListener('recruiter.request.submitted', refresh as EventListener);
    };
  }, []);

  const handleApprove = async (requestId: string) => {
    await recruiterRequestsApi.approve(requestId);
    toast.success('Recruiter approved.');
    await loadRequests();
  };

  const handleReject = async (requestId: string) => {
    await recruiterRequestsApi.reject(requestId);
    toast.success('Recruiter rejected.');
    await loadRequests();
  };

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Pending recruiter requests</h3>
          <p className="text-sm text-ink-600 dark:text-ink-300">Approve or reject recruiter onboarding requests in real time.</p>
        </div>
        <Button variant="secondary" onClick={() => void loadRequests()}>
          Refresh
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">No pending recruiter requests.</div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-ink-950 dark:text-white">{request.userName}</div>
                  <div className="text-sm text-ink-600 dark:text-ink-300">{request.email}</div>
                  <div className="mt-1 text-sm text-ink-500 dark:text-ink-300">
                    {request.companyName} {request.companyWebsite ? `• ${request.companyWebsite}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void handleApprove(request.id)}>
                    <Check size={16} />
                    Approve
                  </Button>
                  <Button variant="ghost" onClick={() => void handleReject(request.id)}>
                    <X size={16} />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
