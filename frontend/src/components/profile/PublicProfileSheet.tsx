import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  fetchPublicProfile,
  type PublicProfile,
} from '../../services/user.service';
import { scopeCss } from '../../utils/profileCss';

/**
 * Another user's profile as a modal sheet — opened e.g. from the creator
 * row on the quest detail screen (z-above it, hence no OverlayPage).
 * Applies the owner's profile CSS with the same `.profile-canvas` scope as
 * their own profile page, so the card looks identical for visitors.
 */
export default function PublicProfileSheet({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stale = false;
    setProfile(null);
    setError(false);
    fetchPublicProfile(userId)
      .then((p) => {
        if (!stale) setProfile(p);
      })
      .catch(() => {
        if (!stale) setError(true);
      });
    return () => {
      stale = true;
    };
  }, [userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const scopedCss = useMemo(
    () =>
      profile?.profileCss ? scopeCss(profile.profileCss, '.profile-canvas') : '',
    [profile?.profileCss],
  );

  const avatarLetter = (
    profile?.displayName?.[0] ||
    profile?.username?.[0] ||
    '?'
  ).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Profil
          </h2>
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
                  className="avatar h-24 w-24 rounded-full object-cover ring-4 ring-indigo-500/20"
                />
              ) : (
                <div className="avatar flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500 text-3xl font-bold text-white ring-4 ring-indigo-500/20">
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
              {profile.bio && (
                <p className="bio mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile.level}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Level
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile.questsCompleted}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quests geschafft
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
