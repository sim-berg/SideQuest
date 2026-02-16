import type { Conversation, Message } from '../types/message';
import { api } from './api';

export function getConversations(): Promise<Conversation[]> {
  return api.get<Conversation[]>('/messages/conversations');
}

export function getMessages(
  userId: string,
  before?: string,
): Promise<Message[]> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  const query = params.toString();
  return api.get<Message[]>(`/messages/${userId}${query ? `?${query}` : ''}`);
}

export function sendMessage(userId: string, body: string): Promise<Message> {
  return api.post<Message>(`/messages/${userId}`, { body });
}

export function markAsRead(userId: string): Promise<void> {
  return api.patch<void>(`/messages/${userId}/read`);
}

export function getUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/messages/unread-count');
}
