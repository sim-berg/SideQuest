import { formatReward } from '../../utils/format';
import PixelIcon from '../common/PixelIcon';

interface QuestRewardProps {
  reward: number;
}

export default function QuestReward({ reward }: QuestRewardProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-neon-yellow/30 bg-neon-yellow/10 px-3 py-2">
      <PixelIcon id={35} size={20} alt="Belohnung" />
      <span className="text-sm font-semibold text-neon-yellow">
        {formatReward(reward)}
      </span>
    </div>
  );
}
