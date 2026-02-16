import { create } from 'zustand';
import type { Message, Conversation } from '../types/message';

interface ChatState {
  conversations: Conversation[];
  activeChat: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Set<string>;
  totalUnread: number;

  setConversations: (convs: Conversation[]) => void;
  openChat: (userId: string) => void;
  closeChat: () => void;
  addMessage: (userId: string, msg: Message) => void;
  setMessages: (userId: string, msgs: Message[]) => void;
  prependMessages: (userId: string, msgs: Message[]) => void;
  markRead: (userId: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  setTotalUnread: (count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeChat: null,
  messages: {},
  typingUsers: new Set<string>(),
  totalUnread: 0,

  setConversations: (conversations) => set({ conversations }),

  openChat: (userId) => set({ activeChat: userId }),

  closeChat: () => set({ activeChat: null }),

  addMessage: (userId, msg) =>
    set((s) => {
      const existing = s.messages[userId] || [];
      return {
        messages: { ...s.messages, [userId]: [...existing, msg] },
      };
    }),

  setMessages: (userId, msgs) =>
    set((s) => ({
      messages: { ...s.messages, [userId]: msgs },
    })),

  prependMessages: (userId, msgs) =>
    set((s) => {
      const existing = s.messages[userId] || [];
      return {
        messages: { ...s.messages, [userId]: [...msgs, ...existing] },
      };
    }),

  markRead: (userId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.user.id === userId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  setTyping: (userId, isTyping) =>
    set((s) => {
      const next = new Set(s.typingUsers);
      if (isTyping) next.add(userId);
      else next.delete(userId);
      return { typingUsers: next };
    }),

  setTotalUnread: (totalUnread) => set({ totalUnread }),
}));
