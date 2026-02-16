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
          ? 'border-neon-magenta/30 bg-neon-magenta/10'
          : 'border-cyber-light-border bg-cyber-light-card dark:border-cyber-border dark:bg-cyber-card'
      }`}
    >
      <PixelIcon id={27} size={20} alt="Zeitlimit" />
      <span
        className={`text-sm font-semibold ${
          isExpired
            ? 'text-neon-magenta'
            : 'text-cyber-light-text dark:text-cyber-text'
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}
