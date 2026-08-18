import { useEffect, useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useFriendStore } from '../../stores/useFriendStore';
import {
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from '../../services/friend.service';
import { searchUsers } from '../../services/user.service';
import type { UserCard } from '../../types/user';
import OverlayPage from '../common/OverlayPage';
import UserCardRow from './UserCardRow';
import PublicProfileSheet from './PublicProfileSheet';

type Tab = 'kumpane' | 'anfragen' | 'finden';

const ICON_BTN =
  'flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95';

/**
 * The community screen: your Kumpane, the requests waiting on you, and a
 * search to find new people. Every row opens that person's full profile.
 */
export default function KumpanePage() {
  const open = useUIStore((s) => s.kumpaneOpen);
  const closeKumpane = useUIStore((s) => s.closeKumpane);
  const { friends, incoming, outgoing, refresh } = useFriendStore();

  const [tab, setTab] = useState<Tab>('kumpane');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  // Debounced search — one request per pause in typing, not per keystroke.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const answer = async (id: string, accept: boolean) => {
    try {
      await (accept ? acceptFriendRequest(id) : declineFriendRequest(id));
    } finally {
      void refresh();
    }
  };

  const invite = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setInvited((s) => new Set(s).add(userId));
      void refresh();
    } catch {
      /* the button stays available for another try */
    }
  };

  if (!open) return null;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'kumpane', label: `Kumpane (${friends.length})` },
    { id: 'anfragen', label: 'Anfragen', badge: incoming.length },
    { id: 'finden', label: 'Finden' },
  ];

  return (
    <OverlayPage
      title="Kumpane"
      icon={<Users className="h-6 w-6 text-indigo-500" strokeWidth={2.2} />}
      onClose={closeKumpane}
    >
      <div>
        <div className="mb-5 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 rounded-xl py-2 text-xs font-bold ${
                tab === t.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {t.label}
              {!!t.badge && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'kumpane' && (
          <div className="flex flex-col gap-2">
            {friends.length === 0 && (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:bg-slate-800/50">
                Noch keine Kumpane. Such jemanden über „Finden".
              </p>
            )}
            {friends.map((f) => (
              <UserCardRow
                key={f.id}
                user={f}
                onClick={() => setOpenProfile(f.id)}
              />
            ))}
          </div>
        )}

        {tab === 'anfragen' && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                An dich · {incoming.length}
              </p>
              <div className="flex flex-col gap-2">
                {incoming.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
                    Keine offenen Anfragen.
                  </p>
                )}
                {incoming.map((r) => (
                  <div key={r.id}>
                    <UserCardRow
                      user={r.user}
                      onClick={() => setOpenProfile(r.user.id)}
                      action={
                        <>
                          <button
                            onClick={() => answer(r.id, true)}
                            aria-label="Annehmen"
                            className={`${ICON_BTN} bg-emerald-500 text-white hover:bg-emerald-600`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => answer(r.id, false)}
                            aria-label="Ablehnen"
                            className={`${ICON_BTN} bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      }
                    />
                    {r.message && (
                      <p className="mt-1 pl-3 text-xs text-slate-400 italic">
                        „{r.message}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Von dir · {outgoing.length}
              </p>
              <div className="flex flex-col gap-2">
                {outgoing.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
                    Du hast keine Anfragen offen.
                  </p>
                )}
                {outgoing.map((r) => (
                  <UserCardRow
                    key={r.id}
                    user={r.user}
                    onClick={() => setOpenProfile(r.user.id)}
                    action={
                      <span className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        wartet
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'finden' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name oder @username"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-9 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {searching && (
              <p className="py-4 text-center text-sm text-slate-400">Suche…</p>
            )}
            {!searching && query.trim() && results.length === 0 && (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
                Niemanden gefunden.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {results.map((u) => {
                const alreadyFriend = friends.some((f) => f.id === u.id);
                const asked =
                  invited.has(u.id) || outgoing.some((r) => r.user.id === u.id);
                return (
                  <UserCardRow
                    key={u.id}
                    user={u}
                    onClick={() => setOpenProfile(u.id)}
                    action={
                      alreadyFriend ? (
                        <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Kumpane
                        </span>
                      ) : asked ? (
                        <span className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          gefragt
                        </span>
                      ) : (
                        <button
                          onClick={() => invite(u.id)}
                          className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-600"
                        >
                          Anfragen
                        </button>
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {openProfile && (
        <PublicProfileSheet
          userId={openProfile}
          onClose={() => {
            setOpenProfile(null);
            void refresh();
          }}
        />
      )}
    </OverlayPage>
  );
}
