import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { chatApi } from '@/api/chatApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { usersApi } from '@/api/usersApi';
import { messageReceived } from '@/store/slices/chatSlice';
import { normalizeRole } from '@/utils/roles';
import type { ChatContact, ChatConversation, ChatMessage, User } from '@/types';

interface ChatPanelProps {
  title: string;
  description: string;
  emptyMessage: string;
  storageKey: string;
  threadHint?: string;
}

const selectedConversationStorageKey = (storageKey: string) => `ijmp.chat.selected.${storageKey}`;

const mergeUniqueMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const map = new Map<string, ChatMessage>();
  for (const message of current) {
    map.set(message.id, message);
  }
  for (const message of incoming) {
    map.set(message.id, message);
  }
  return Array.from(map.values()).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
};

export function ChatPanel({ title, description, emptyMessage, storageKey, threadHint }: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const liveMessages = useAppSelector((state) => state.chat.messages);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [newRecipientId, setNewRecipientId] = useState('');
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    void chatApi
      .listConversations()
      .then((response) => {
        const items = response.data.data ?? [];
        setConversations(items);
        const firstConversation = items[0];
        const storedId = window.localStorage.getItem(selectedConversationStorageKey(storageKey));
        const nextSelectedId = storedId && items.some((conversation) => conversation.conversationId === storedId)
          ? storedId
          : firstConversation?.conversationId ?? '';
        if (nextSelectedId) {
          setSelectedConversationId(nextSelectedId);
        }
      })
      .catch(() => {
        setConversations([]);
      })
      .finally(() => {
        setLoadingConversations(false);
      });

    void chatApi
      .listContacts()
      .then((response) => {
        setContacts(response.data.data ?? []);
      })
      .catch(() => {
        setContacts([]);
      })
      .finally(() => {
        setLoadingContacts(false);
      });

    void usersApi
      .getMe()
      .then((response) => {
        setCurrentUser(response.data.data ?? null);
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, [storageKey]);

  useEffect(() => {
    const refreshConversations = () => {
      void chatApi
        .listConversations()
        .then((response) => setConversations(response.data.data ?? []))
        .catch(() => setConversations([]));
    };

    window.addEventListener('chat.updated', refreshConversations as EventListener);

    if (!selectedConversationId) {
      setSelectedConversation(null);
      setThreadMessages([]);
      return () => window.removeEventListener('chat.updated', refreshConversations as EventListener);
    }

    window.localStorage.setItem(selectedConversationStorageKey(storageKey), selectedConversationId);
    setSelectedConversation(conversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null);
    setLoadingThread(true);
    void chatApi
      .getConversationMessages(selectedConversationId)
      .then((response) => {
        setThreadMessages(response.data.data ?? []);
      })
      .catch(() => {
        setThreadMessages([]);
      })
      .finally(() => {
        setLoadingThread(false);
      });
    return () => window.removeEventListener('chat.updated', refreshConversations as EventListener);
  }, [conversations, selectedConversationId, storageKey]);

  useEffect(() => {
    const refreshConversations = () => {
      void chatApi
        .listConversations()
        .then((response) => setConversations(response.data.data ?? []))
        .catch(() => setConversations([]));
    };

    window.addEventListener('conversation.updated', refreshConversations as EventListener);

    if (!selectedConversationId || liveMessages.length === 0) {
      return () => window.removeEventListener('conversation.updated', refreshConversations as EventListener);
    }

    const relevant = liveMessages.filter((message) => message.conversationId === selectedConversationId);
    if (relevant.length === 0) {
      return () => window.removeEventListener('conversation.updated', refreshConversations as EventListener);
    }

    setThreadMessages((current) => mergeUniqueMessages(current, relevant));
    return () => window.removeEventListener('conversation.updated', refreshConversations as EventListener);
  }, [liveMessages, selectedConversationId]);

  const visibleMessages = useMemo(() => threadMessages, [threadMessages]);

  const activeConversationLabel = useMemo(() => {
    if (!selectedConversation) {
      return 'No conversation selected';
    }

    return `${selectedConversation.recipientName} · ${normalizeRole(selectedConversation.recipientRole)}`;
  }, [selectedConversation]);

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const createConversation = async () => {
    if (!newRecipientId.trim()) {
      toast.error('Pick a contact first.');
      return;
    }

    setCreatingConversation(true);
    try {
      const response = await chatApi.createConversation({
        recipientUserId: newRecipientId.trim(),
        subject: newSubject.trim() || undefined,
      });

      const createdConversation = response.data.data;
      if (createdConversation) {
        setConversations((current) => [createdConversation, ...current.filter((conversation) => conversation.conversationId !== createdConversation.conversationId)]);
        setSelectedConversation(createdConversation);
        setSelectedConversationId(createdConversation.conversationId);
        setThreadMessages([]);
        setDraft('');
        toast.success('Conversation ready.');
      }
    } catch {
      // toast handled by interceptor
    } finally {
      setCreatingConversation(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation) {
      toast.error('Select or create a conversation first.');
      return;
    }

    const body = draft.trim();
    if (!body) {
      toast.error('Write a message first.');
      return;
    }

    setSending(true);
    try {
      const response = await chatApi.send({
        conversationId: selectedConversation.conversationId,
        recipientUserId: selectedConversation.recipientUserId,
        body,
      });

      const sentMessage = response.data.data;
      if (sentMessage) {
        dispatch(messageReceived(sentMessage));
        setThreadMessages((current) => mergeUniqueMessages(current, [sentMessage]));
        setConversations((current) =>
          current
            .map((conversation) =>
              conversation.conversationId === selectedConversation.conversationId
                ? {
                    ...conversation,
                    lastMessageBody: sentMessage.body,
                    lastMessageAt: sentMessage.createdAt,
                    unreadCount: 0,
                  }
                : conversation,
            )
            .sort((left, right) => new Date(right.lastMessageAt ?? 0).getTime() - new Date(left.lastMessageAt ?? 0).getTime()),
        );
        setDraft('');
      }
    } catch {
      // toast handled by interceptor
    } finally {
      setSending(false);
    }
  };

  const selectedThreadMessages = visibleMessages.filter((message) => message.conversationId === selectedConversationId);
  const unreadCount = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <div className="glass-panel rounded-3xl border border-sky-500/10 bg-gradient-to-br from-[#0f1a2b]/92 to-[#0a1424]/92 p-5 text-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)] lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="text-sm text-white/72">{description}</p>
            </div>
            <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
              {unreadCount} unread
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              ['Conversations', conversations.length],
              ['Contacts', contacts.length],
              ['Realtime', 'On'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{label}</div>
                <div className="mt-2 text-sm font-semibold text-white">{value as string | number}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/8 bg-[#0c1626]/92 p-5 text-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)] lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Conversations</h3>
              <p className="text-sm text-white/70">Pick a thread and continue the discussion.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loadingConversations ? (
              <Loader label="Loading conversations..." />
            ) : conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/12 px-4 py-8 text-sm text-white/65">
                No conversations yet. Start one with a contact below.
              </div>
            ) : (
              conversations.map((conversation) => {
                const active = conversation.conversationId === selectedConversationId;
                return (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() => selectConversation(conversation.conversationId)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      active
                        ? 'border-sky-400/25 bg-sky-400/12 shadow-[0_12px_30px_-28px_rgba(56,189,248,0.7)]'
                        : 'border-white/10 bg-white/[0.04] hover:border-sky-400/20 hover:bg-sky-400/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{conversation.recipientName}</div>
                        <div className="text-xs uppercase tracking-[0.16em] text-white/55">{normalizeRole(conversation.recipientRole)}</div>
                      </div>
                      {conversation.unreadCount > 0 ? (
                        <span className="rounded-full bg-coral-500/15 px-2 py-1 text-xs font-semibold text-coral-300">{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/72">
                      {conversation.lastMessageBody ?? conversation.subject ?? 'No messages yet.'}
                    </p>
                    <div className="mt-3 text-xs text-white/45">
                      {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : 'Just created'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/8 bg-[#0c1626]/92 p-5 text-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)] lg:p-6">
          <div>
            <h3 className="text-base font-semibold text-white">Start new chat</h3>
            <p className="text-sm text-white/70">
              Pick a contact and the system will create the conversation for you.
            </p>
          </div>

          {loadingContacts ? (
            <div className="mt-4">
              <Loader label="Loading contacts..." />
            </div>
          ) : contacts.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-white/12 px-4 py-8 text-sm text-white/65">
              No contacts are available for this account yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-2 text-sm text-white/80">
                <span className="font-medium">Contact</span>
                <select
                  value={newRecipientId}
                  onChange={(event) => setNewRecipientId(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0f1a2b] px-4 py-3 text-white outline-none transition focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.userId} value={contact.userId}>
                      {contact.fullName} — {normalizeRole(contact.role)}
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder="Optional subject" />
              <Button type="button" className="w-full" onClick={() => void createConversation()} disabled={creatingConversation || !newRecipientId.trim()}>
                {creatingConversation ? 'Creating...' : 'Create conversation'}
              </Button>
            </div>
          )}
        </div>
      </aside>

      <section className="glass-panel rounded-3xl border border-white/8 bg-[#0c1626]/92 p-5 text-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)] lg:p-6">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{selectedConversation ? activeConversationLabel : 'Select a conversation'}</h2>
            <p className="text-sm text-white/70">
              {selectedConversation
                ? `Conversation ID ${selectedConversation.conversationId}`
                : 'Use the sidebar to open an existing thread or start a new one.'}
            </p>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Realtime ready</div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['Messages', selectedThreadMessages.length],
            ['State', loadingThread ? 'Loading...' : selectedConversation ? 'Active' : 'Idle'],
            ['Identity', currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Loading...'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{label}</div>
              <div className="mt-2 text-sm font-semibold text-white">{value as string | number}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {loadingThread ? (
            <Loader label="Loading conversation..." />
          ) : selectedConversationId ? (
            selectedThreadMessages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-white/65">
                {emptyMessage}
              </div>
            ) : (
              selectedThreadMessages.map((item) => {
                const mine = currentUser?.id === item.senderUserId;
                return (
                  <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                        mine ? 'bg-sky-400/15 text-white' : 'bg-white/[0.05] text-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                        <span>{mine ? 'You' : 'Participant'}</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{item.body}</p>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-ink-500 dark:border-white/10">
              Select a conversation from the left to view messages.
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex flex-col gap-2 text-sm text-white/80">
            <span className="font-medium">Message</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder="Type a message..."
              className="rounded-2xl border border-white/10 bg-[#0f1a2b] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10"
              disabled={!selectedConversation}
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/55">
              {threadHint ? threadHint : 'Choose a contact, start the thread, and keep the conversation live.'}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setDraft('')} disabled={!draft}>
                Clear
              </Button>
              <Button type="button" onClick={() => void sendMessage()} disabled={sending || !selectedConversation || !draft.trim()}>
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
