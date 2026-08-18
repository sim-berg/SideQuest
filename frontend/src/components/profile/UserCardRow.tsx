import type { UserCard } from '../../types/user';

/** One person as a tappable row — used in friends, requests and search. */
export default function UserCardRow({
  user,
  onClick,
  action,
}: {
  user: UserCard;
  onClick?: () => void;
  /** Buttons rendered on the right (accept/decline, ...). */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="relative shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || user.username}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-base font-bold text-white">
              {(user.displayName?.[0] || user.username[0]).toUpperCase()}
            </span>
          )}
          {user.isOnline && (
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-50 dark:ring-slate-800" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {user.displayName || user.username}
            </span>
            {user.characterClass && (
              <span title={user.characterClass.name}>
                {user.characterClass.emoji}
              </span>
            )}
            {user.openForQuests && (
              <span
                title="Open for Quests"
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
            )}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {user.status || `@${user.username} · Level ${user.level}`}
          </span>
        </span>
      </button>

      {action && <div className="flex shrink-0 gap-1.5">{action}</div>}
    </div>
  );
}
