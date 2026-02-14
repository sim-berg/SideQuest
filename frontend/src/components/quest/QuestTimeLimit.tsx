import { formatTimeRemaining } from '../../utils/format';
import PixelIcon from '../common/PixelIcon';

interface QuestTimeLimitProps {
  timeLimit: string;
}

export default function QuestTimeLimit({ timeLimit }: QuestTimeLimitProps) {
  const remaining = formatTimeRemaining(timeLimit);
  const isExpired = remaining === 'Abgelaufen';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 ${
        isExpired
          ? 'border-quest-mystery/40 bg-quest-mystery/10 dark:border-quest-mystery/30 dark:bg-quest-mystery/10'
          : 'border-wood-light/30 bg-parchment dark:border-wood/30 dark:bg-wood-dark/50'
      }`}
    >
      <PixelIcon id={27} size={20} alt="Zeitlimit" />
      <span
        className={`text-sm font-semibold ${
          isExpired
            ? 'text-quest-mystery dark:text-quest-mystery'
            : 'text-medieval-text dark:text-medieval-text-light'
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}
