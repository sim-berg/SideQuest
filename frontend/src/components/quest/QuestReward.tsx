import { formatReward } from '../../utils/format';
import PixelIcon from '../common/PixelIcon';

interface QuestRewardProps {
  reward: number;
}

export default function QuestReward({ reward }: QuestRewardProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 dark:border-gold-dark/40 dark:bg-gold-dark/10">
      <PixelIcon id={35} size={20} alt="Belohnung" />
      <span className="text-sm font-semibold text-gold-dark dark:text-gold-light">
        {formatReward(reward)}
      </span>
    </div>
  );
}
