import { apiClient } from './client';
import type { ApiResponse, ChatContact, ChatConversation, ChatMessage } from '@/types';

export const chatApi = {
  listConversations() {
    return apiClient.get<ApiResponse<ChatConversation[]>>('/api/chat/conversations');
  },
  listContacts() {
    return apiClient.get<ApiResponse<ChatContact[]>>('/api/chat/contacts');
  },
  createConversation(payload: { recipientUserId: string; subject?: string }) {
    return apiClient.post<ApiResponse<ChatConversation>>('/api/chat/conversations', payload);
  },
  getConversationMessages(conversationId: string) {
    return apiClient.get<ApiResponse<ChatMessage[]>>(`/api/chat/conversations/${conversationId}/messages`);
  },
  send(payload: { conversationId: string; recipientUserId: string; body: string }) {
    return apiClient.post<ApiResponse<ChatMessage>>('/api/chat/messages', payload);
  },
};
