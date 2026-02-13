import { formatReward } from '../../utils/format';

interface QuestRewardProps {
  reward: number;
}

export default function QuestReward({ reward }: QuestRewardProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
      <span className="text-lg">🏆</span>
      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
        {formatReward(reward)}
      </span>
    </div>
  );
}
