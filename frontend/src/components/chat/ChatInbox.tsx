import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useUIStore } from '../../stores/useUIStore';
import { getConversations } from '../../services/message.service';
import type { Conversation } from '../../types/message';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade';
  if (mins < 60) return `${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} T.`;
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });
}

function ConversationRow({
  conv,
  onClick,
}: {
  conv: Conversation;
  onClick: () => void;
}) {
  const avatar =
    conv.user.displayName?.[0]?.toUpperCase() ||
    conv.user.username[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors active:bg-slate-50 dark:active:bg-slate-800"
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        {conv.user.avatarUrl ? (
          <img
            src={conv.user.avatarUrl}
            alt={conv.user.displayName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-lg font-bold text-white">
            {avatar}
          </div>
        )}
        {conv.user.isOnline && (
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {conv.user.displayName || conv.user.username}
          </p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatRelativeTime(conv.lastMessage.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {conv.lastMessage.body}
          </p>
          {conv.unreadCount > 0 && (
            <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ChatInbox() {
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const openChat = useChatStore((s) => s.openChat);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setConversations]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 pb-3 pt-5 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('map')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Nachrichten
        </h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center pt-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-slate-400 dark:text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="mb-3 h-12 w-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            <p className="text-sm">Noch keine Nachrichten</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.user.id}
                conv={conv}
                onClick={() => openChat(conv.user.id)}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
