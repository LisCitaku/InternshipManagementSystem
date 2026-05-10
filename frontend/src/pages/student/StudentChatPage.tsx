import { ChatPanel } from '@/components/ChatPanel';
import { SectionHeader } from '@/components/SectionHeader';

export default function StudentChatPage() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Chat" description="This panel is ready for SignalR-delivered messages and recruiter conversations." />
      <ChatPanel
        title="Conversation space"
        description="Keep an eye on active recruiter threads and live updates."
        emptyMessage="No messages yet. When the backend sends chat events, they will stream into this area."
        storageKey="student"
        threadHint="Paste a recruiter conversation ID and recruiter user ID here. Save once, then chat works with live SignalR updates."
      />
    </div>
  );
}
