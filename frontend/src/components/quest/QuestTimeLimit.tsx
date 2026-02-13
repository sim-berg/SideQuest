import { formatTimeRemaining } from '../../utils/format';

interface QuestTimeLimitProps {
  timeLimit: string;
}

export default function QuestTimeLimit({ timeLimit }: QuestTimeLimitProps) {
  const remaining = formatTimeRemaining(timeLimit);
  const isExpired = remaining === 'Abgelaufen';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${
        isExpired
          ? 'bg-red-50 dark:bg-red-900/20'
          : 'bg-blue-50 dark:bg-blue-900/20'
      }`}
    >
      <span className="text-lg">⏰</span>
      <span
        className={`text-sm font-semibold ${
          isExpired
            ? 'text-red-600 dark:text-red-400'
            : 'text-blue-700 dark:text-blue-400'
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}
