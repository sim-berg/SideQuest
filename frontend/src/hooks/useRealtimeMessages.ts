import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket.service';
import { useChatStore } from '../stores/useChatStore';
import { useAuthStore } from '../stores/useAuthStore';
import * as messageService from '../services/message.service';

interface IncomingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  body: string;
  createdAt: string;
}

export function useRealtimeMessages() {
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setTotalUnread = useChatStore((s) => s.setTotalUnread);
  const setConversations = useChatStore((s) => s.setConversations);
  const activeChat = useChatStore((s) => s.activeChat);
  const markRead = useChatStore((s) => s.markRead);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: IncomingMessage) => {
      addMessage(msg.senderId, {
        id: msg.id,
        senderId: msg.senderId,
        recipientId: useAuthStore.getState().user?.id || '',
        body: msg.body,
        read: false,
        createdAt: msg.createdAt,
      });

      // Refresh conversations and unread count
      messageService
        .getConversations()
        .then(setConversations)
        .catch(() => {});
      messageService
        .getUnreadCount()
        .then((r) => setTotalUnread(r.count))
        .catch(() => {});

      // If this chat is currently open, mark as read immediately
      if (useChatStore.getState().activeChat === msg.senderId) {
        messageService
          .markAsRead(msg.senderId)
          .then(() => markRead(msg.senderId))
          .catch(() => {});
      }
    };

    const handleRead = ({ userId }: { userId: string }) => {
      markRead(userId);
    };

    const handleTyping = ({ senderId }: { senderId: string }) => {
      setTyping(senderId, true);
      if (typingTimers.current[senderId]) {
        clearTimeout(typingTimers.current[senderId]);
      }
      typingTimers.current[senderId] = setTimeout(() => {
        setTyping(senderId, false);
      }, 3000);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleRead);
    socket.on('message:typing', handleTyping);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleRead);
      socket.off('message:typing', handleTyping);
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [
    isAuthenticated,
    addMessage,
    setTyping,
    setTotalUnread,
    setConversations,
    activeChat,
    markRead,
  ]);
}
