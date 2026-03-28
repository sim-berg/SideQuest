interface UserProfileSheetProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    level: number;
    questsCompleted: number;
    isOnline: boolean;
  };
  onClose: () => void;
  onSendMessage: (userId: string) => void;
}

export default function UserProfileSheet({
  user,
  onClose,
  onSendMessage,
}: UserProfileSheetProps) {
  const avatar =
    user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white px-5 pb-10 pt-6 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 backdrop-blur-sm dark:bg-slate-700/80 dark:text-slate-300"
          aria-label="Schliessen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Avatar + Name */}
        <div className="mb-4 flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-xl font-bold text-white">
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                {user.displayName || user.username}
              </h2>
              {user.isOnline && (
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              )}
            </div>
            <p className="text-sm text-slate-400">@{user.username}</p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {user.bio}
          </p>
        )}

        {/* Stats */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
            <p className="text-lg font-bold text-indigo-500">{user.level}</p>
            <p className="text-xs text-slate-500">Level</p>
          </div>
          <div className="flex-1 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
            <p className="text-lg font-bold text-indigo-500">
              {user.questsCompleted}
            </p>
            <p className="text-xs text-slate-500">Quests</p>
          </div>
        </div>

        {/* Send Message */}
        <button
          onClick={() => onSendMessage(user.id)}
          className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98]"
        >
          Nachricht senden
        </button>
      </div>
    </div>
  );
}
