import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, MapPin, X } from 'lucide-react';
import { fetchPublicProfile } from '../../services/user.service';
import { fetchFriendCount } from '../../services/friend.service';
import type { PublicProfile } from '../../types/user';
import { scopeCss } from '../../utils/profileCss';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import EmblemShelf from './EmblemShelf';
import FriendButton from './FriendButton';
import ProfileWall from './ProfileWall';

type Tab = 'embleme' | 'pinnwand';

function joinedLabel(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Another user's full profile as a modal sheet — opened from a quest's creator
 * row, a wall note, or the Kumpane list. Applies the owner's profile CSS with
 * the same `.profile-canvas` scope as their own page, so the card looks
 * identical for visitors.
 *
 * The sheet keeps its own navigation stack: tapping an author on the wall
 * walks to that profile, and the back arrow returns.
 */
export default function PublicProfileSheet({
  userId,
  onClose,
  onSendMessage,
}: {
  userId: string;
  onClose: () => void;
  /** Override how a message is started; defaults to opening the chat. */
  onSendMessage?: (userId: string) => void;
}) {
  const me = useAuthStore((s) => s.user);
  const openChat = useChatStore((s) => s.openChat);
  // Trail of visited profiles; the last entry is the one on screen.
  const [trail, setTrail] = useState<string[]>([userId]);
  const currentId = trail[trail.length - 1];

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('embleme');

  // Walking to another profile (or being handed a new `userId`) means the
  // loaded data belongs to someone else — clear it during render rather than
  // showing the previous person for a frame.
  const [shownId, setShownId] = useState(currentId);
  if (shownId !== currentId) {
    setShownId(currentId);
    setProfile(null);
    setFriendCount(null);
    setError(false);
  }
  const [propUserId, setPropUserId] = useState(userId);
  if (propUserId !== userId) {
    setPropUserId(userId);
    setTrail([userId]);
  }

  /** Re-fetch the current profile; also used after a friendship changes. */
  const load = useCallback(() => {
    let stale = false;
    fetchPublicProfile(currentId)
      .then((p) => !stale && setProfile(p))
      .catch(() => !stale && setError(true));
    fetchFriendCount(currentId)
      .then((n) => !stale && setFriendCount(n))
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [currentId]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const scopedCss = useMemo(
    () =>
      profile?.profileCss ? scopeCss(profile.profileCss, '.profile-canvas') : '',
    [profile],
  );

  const avatarLetter = (
    profile?.displayName?.[0] ||
    profile?.username?.[0] ||
    '?'
  ).toUpperCase();

  const isMe = me?.id === currentId;
  const accent = profile?.accentColor || '#6366f1';

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          {trail.length > 1 ? (
            <button
              onClick={() => setTrail((t) => t.slice(0, -1))}
              aria-label="Zurück"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Profil
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Profil konnte nicht geladen werden.
          </p>
        )}

        {!profile && !error && (
          <div className="flex animate-pulse flex-col items-center py-8">
            <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        )}

        {profile && (
          <>
            {/* The owner's CSS playground, exactly like on their own page */}
            {scopedCss && <style>{scopedCss}</style>}
            <div className="profile-canvas flex flex-col items-center rounded-2xl p-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.username}
                  className="avatar h-24 w-24 rounded-full object-cover ring-4"
                  style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
                />
              ) : (
                <div
                  className="avatar flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {avatarLetter}
                </div>
              )}

              <h2 className="name mt-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                {profile.displayName || profile.username}
                {profile.isOnline && (
                  <span
                    title="Online"
                    className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                  />
                )}
              </h2>
              <p className="username text-sm text-slate-400">
                @{profile.username}
              </p>

              {/* Character class + open-for-quests, the two identity signals */}
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {profile.characterClass && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: profile.characterClass.color }}
                  >
                    {profile.characterClass.emoji} {profile.characterClass.name}
                  </span>
                )}
                {profile.openForQuests && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    ✅ Open for Quests
                  </span>
                )}
                {profile.homeRegion && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <MapPin className="h-3 w-3" />
                    {profile.homeRegion}
                  </span>
                )}
              </div>

              {profile.status && (
                <p className="status mt-2 text-center text-sm font-medium italic text-slate-500 dark:text-slate-400">
                  „{profile.status}"
                </p>
              )}
              {profile.bio && (
                <p className="bio mt-2 text-center text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Pinned emblems right under the card — the shelf window */}
            {profile.featuredEmblems.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {profile.featuredEmblems.map((e) => (
                  <img
                    key={e.key}
                    src={e.imageUrl ?? undefined}
                    alt={e.title}
                    title={e.title}
                    className="h-9 w-9 rounded-full object-contain"
                    style={{ boxShadow: `0 2px 8px ${e.color}44` }}
                  />
                ))}
              </div>
            )}

            {/* Links the user put on their profile */}
            {profile.links.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                {profile.links.map((l, i) => (
                  <a
                    key={`${l.url}-${i}`}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="truncate">{l.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2">
              <Stat value={profile.level} label="Level" />
              <Stat value={profile.questsCompleted} label="Quests" />
              <Stat value={profile.emblemCount} label="Embleme" />
              <Stat value={friendCount ?? '—'} label="Kumpane" />
            </div>

            {profile.joinedAt && (
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Dabei seit {joinedLabel(profile.joinedAt)}
                {profile.dailyQuestStreak > 0 &&
                  ` · 🔥 ${profile.dailyQuestStreak} Tage Serie`}
              </p>
            )}

            {/* Contact — only for other people's profiles */}
            {!isMe && me && (
              <div className="mt-4 flex flex-col gap-2">
                <FriendButton userId={currentId} onChanged={load} />
                <button
                  onClick={() => {
                    // The chat lives outside this sheet, so step out of the
                    // way before it opens.
                    onClose();
                    (onSendMessage ?? openChat)(currentId);
                  }}
                  className="w-full rounded-xl border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Nachricht senden
                </button>
              </div>
            )}

            {/* Emblems and wall */}
            <div className="mt-6 mb-4 flex gap-2">
              {(['embleme', 'pinnwand'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={
                    tab === t
                      ? 'flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900'
                      : 'flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }
                >
                  {t === 'embleme'
                    ? `Embleme (${profile.emblemCount})`
                    : 'Pinnwand'}
                </button>
              ))}
            </div>

            {tab === 'embleme' ? (
              <EmblemShelf
                emblems={profile.emblems}
                featured={profile.featuredEmblems}
                ownerName={profile.displayName || profile.username}
              />
            ) : (
              <ProfileWall
                userId={currentId}
                onOpenProfile={(id) =>
                  id !== currentId && setTrail((t) => [...t, id])
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
