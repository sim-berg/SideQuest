import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getConversations,
} from '../../services/message.service';
import { getSocket } from '../../services/socket.service';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import type { Message } from '../../types/message';

const EMPTY_MESSAGES: Message[] = [];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatView() {
  const activeChat = useChatStore((s) => s.activeChat);
  const closeChat = useChatStore((s) => s.closeChat);
  const messages = useChatStore((s) =>
    s.activeChat ? s.messages[s.activeChat] || EMPTY_MESSAGES : EMPTY_MESSAGES,
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const markReadInStore = useChatStore((s) => s.markRead);
  const setConversations = useChatStore((s) => s.setConversations);
  const conversations = useChatStore((s) => s.conversations);
  const currentUser = useAuthStore((s) => s.user);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatUser = conversations.find((c) => c.user.id === activeChat)?.user;
  const isTyping = activeChat ? typingUsers.has(activeChat) : false;

  // Load initial messages
  useEffect(() => {
    if (!activeChat) return;
    getMessages(activeChat)
      .then((msgs) => {
        setMessages(activeChat, msgs.reverse());
        setHasMore(msgs.length >= 50);
      })
      .catch(() => {});

    // Mark as read
    markAsRead(activeChat)
      .then(() => {
        markReadInStore(activeChat);
        getConversations().then(setConversations).catch(() => {});
      })
      .catch(() => {});
  }, [activeChat, setMessages, markReadInStore, setConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!activeChat || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0];
      const older = await getMessages(activeChat, oldest.id);
      if (older.length < 50) setHasMore(false);
      if (older.length > 0) {
        prependMessages(activeChat, older.reverse());
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }, [activeChat, loadingMore, hasMore, messages, prependMessages]);

  // Scroll handler for infinite scroll
  const handleScroll = () => {
    if (listRef.current && listRef.current.scrollTop < 50) {
      loadMore();
    }
  };

  // Send message
  const handleSend = async () => {
    if (!activeChat || !input.trim() || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);
    try {
      const msg = await sendMessage(activeChat, body);
      addMessage(activeChat, msg);
      getConversations().then(setConversations).catch(() => {});
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  // Typing indicator
  const emitTyping = () => {
    if (!activeChat) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:typing', { recipientId: activeChat });

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingTimer.current = null;
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChat) return null;

  const avatar =
    chatUser?.displayName?.[0]?.toUpperCase() ||
    chatUser?.username?.[0]?.toUpperCase() ||
    '?';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <button
          onClick={closeChat}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ←
        </button>
        <div className="relative">
          {chatUser?.avatarUrl ? (
            <img
              src={chatUser.avatarUrl}
              alt={chatUser.displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
              {avatar}
            </div>
          )}
          {chatUser?.isOnline && (
            <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {chatUser?.displayName || chatUser?.username || 'Nutzer'}
          </p>
          {chatUser?.isOnline && (
            <p className="text-[11px] text-green-500">Online</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
          </div>
        )}
        {messages.map((msg: Message) => (
          <ChatBubble
            key={msg.id}
            body={msg.body}
            time={formatTime(msg.createdAt)}
            isOwn={msg.senderId === currentUser?.id}
            read={msg.read}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              emitTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht..."
            maxLength={2000}
            rows={1}
            className="max-h-24 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
