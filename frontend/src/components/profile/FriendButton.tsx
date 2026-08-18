import { useEffect, useState } from 'react';
import { Check, Clock, UserMinus, UserPlus, X } from 'lucide-react';
import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchRelation,
  removeFriend,
  sendFriendRequest,
} from '../../services/friend.service';
import type { RelationView } from '../../types/friendship';
import { cn } from '../../utils/cn';

const BASE =
  'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60';

/**
 * The one control that covers the whole Kumpanen lifecycle: ask, wait,
 * accept/decline, and unfriend. It loads the current relation itself so any
 * profile view can drop it in with just a user id.
 */
export default function FriendButton({
  userId,
  onChanged,
}: {
  userId: string;
  onChanged?: () => void;
}) {
  const [relation, setRelation] = useState<RelationView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    setRelation(null);
    fetchRelation(userId)
      .then((r) => !stale && setRelation(r))
      .catch(() => !stale && setRelation(null));
    return () => {
      stale = true;
    };
  }, [userId]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setRelation(await fetchRelation(userId));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hat nicht geklappt');
    } finally {
      setBusy(false);
    }
  };

  if (!relation) {
    return <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  }

  return (
    <div>
      {relation.relation === 'friends' && (
        <button
          disabled={busy}
          onClick={() => run(() => removeFriend(userId))}
          className={cn(
            BASE,
            'border-2 border-emerald-200 text-emerald-600 hover:bg-red-50 hover:text-red-500 dark:border-emerald-900 dark:text-emerald-400',
          )}
        >
          <UserMinus className="h-4 w-4" />
          Kumpane — Bund lösen
        </button>
      )}

      {relation.relation === 'request_sent' && (
        <button
          disabled={busy}
          onClick={() => run(() => removeFriend(userId))}
          className={cn(
            BASE,
            'border-2 border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400',
          )}
        >
          <Clock className="h-4 w-4" />
          Anfrage gesendet — zurückziehen
        </button>
      )}

      {relation.relation === 'request_received' && relation.requestId && (
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => run(() => acceptFriendRequest(relation.requestId!))}
            className={cn(BASE, 'bg-emerald-500 text-white hover:bg-emerald-600')}
          >
            <Check className="h-4 w-4" />
            Annehmen
          </button>
          <button
            disabled={busy}
            onClick={() => run(() => declineFriendRequest(relation.requestId!))}
            className={cn(
              BASE,
              'border-2 border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400',
            )}
          >
            <X className="h-4 w-4" />
            Ablehnen
          </button>
        </div>
      )}

      {(relation.relation === 'none' || relation.relation === 'declined') && (
        <button
          disabled={busy}
          onClick={() => run(() => sendFriendRequest(userId))}
          className={cn(BASE, 'bg-indigo-500 text-white hover:bg-indigo-600')}
        >
          <UserPlus className="h-4 w-4" />
          Als Kumpane anfragen
        </button>
      )}

      {error && (
        <p className="mt-2 text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
