import { apiFetch } from './api';

export interface ConversationSummary {
  id: number;
  title: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: number;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: number;
  title: string;
  messages: ChatMessageRecord[];
}

export function listConversations() {
  return apiFetch<ConversationSummary[]>('/api/Conversations');
}

export function getConversation(id: number) {
  return apiFetch<ConversationDetail>(`/api/Conversations/${id}`);
}

export function renameConversation(id: number, title: string) {
  return apiFetch<void>(`/api/Conversations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

export function deleteConversation(id: number) {
  return apiFetch<void>(`/api/Conversations/${id}`, { method: 'DELETE' });
}