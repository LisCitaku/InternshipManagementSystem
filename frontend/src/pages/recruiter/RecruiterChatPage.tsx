import { ChatPanel } from '@/components/ChatPanel';
import { SectionHeader } from '@/components/SectionHeader';

export default function RecruiterChatPage() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Recruiter chat" description="Monitor candidate conversations and keep communication live." />
      <ChatPanel
        title="Recruiting inbox"
        description="Track open threads, follow-ups, and interview coordination."
        emptyMessage="No recruiter conversations yet. Incoming SignalR events will appear here."
        storageKey="recruiter"
        threadHint="Paste a student conversation ID and student user ID here. Once saved, every message is persisted and streamed live."
      />
    </div>
  );
}
