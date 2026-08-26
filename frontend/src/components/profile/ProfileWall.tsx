import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import {
  deleteProfileComment,
  fetchProfileComments,
  postProfileComment,
} from '../../services/profileComment.service';
import type { ProfileComment } from '../../types/profileComment';
import { useAuthStore } from '../../stores/useAuthStore';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tg.`;
  return new Date(iso).toLocaleDateString('de-DE');
}

/**
 * The guest book on a profile. Every note links back to its author's profile,
 * so the community can walk from one person to the next.
 */
export default function ProfileWall({
  userId,
  onOpenProfile,
}: {
  userId: string;
  /** Called with the author's id when a note's author is tapped. */
  onOpenProfile?: (userId: string) => void;
}) {
  const me = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<ProfileComment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    setComments(null);
    fetchProfileComments(userId)
      .then((c) => !stale && setComments(c))
      .catch(() => !stale && setComments([]));
    return () => {
      stale = true;
    };
  }, [userId]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await postProfileComment(userId, body);
      setComments((prev) => [created, ...(prev ?? [])]);
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Konnte nicht gesendet werden');
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    const before = comments;
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    try {
      await deleteProfileComment(userId, id);
    } catch {
      setComments(before); // put it back — the delete didn't happen
    }
  };

  return (
    <div>
      {me && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              maxLength={500}
              placeholder={
                me.id === userId
                  ? 'Notiz an dein eigenes Profil...'
                  : 'Schreib etwas auf die Pinnwand...'
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={submit}
              disabled={sending || !draft.trim()}
              aria-label="Senden"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
      )}

      {comments === null && (
        <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      )}

      {comments?.length === 0 && (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
          Noch keine Einträge. Sei die erste Person.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {comments?.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenProfile?.(c.authorId)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                {c.authorAvatarUrl ? (
                  <img
                    src={c.authorAvatarUrl}
                    alt={c.authorName}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                    {(c.authorName[0] || '?').toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white">
                  {c.authorName}
                </span>
              </button>
              <span className="shrink-0 text-[10px] text-slate-400">
                {relativeTime(c.createdAt)}
              </span>
              {me && (me.id === c.authorId || me.id === userId) && (
                <button
                  onClick={() => remove(c.id)}
                  aria-label="Löschen"
                  className="shrink-0 text-slate-300 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-2 pl-9 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200">
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
