import type { Quest } from '../../types/quest';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { useUIStore } from '../../stores/useUIStore';
import { formatDistance } from '../../utils/format';
import CategoryBadge from './CategoryBadge';
import QuestReward from './QuestReward';
import QuestTimeLimit from './QuestTimeLimit';
import PixelIcon from '../common/PixelIcon';

interface QuestDetailProps {
  quest: Quest;
}

export default function QuestDetail({ quest }: QuestDetailProps) {
  const distance = useQuestDistance(quest.lat, quest.lng);
  const openInfoPage = useUIStore((s) => s.openInfoPage);

  return (
    <div className="flex flex-col gap-4 bg-parchment-light px-5 pb-8 dark:bg-medieval-surface">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-pixel text-sm leading-relaxed text-medieval-text dark:text-medieval-text-light">
          {quest.title}
        </h2>
        <CategoryBadge category={quest.category} />
      </div>

      <p className="text-sm leading-relaxed text-wood-dark dark:text-parchment">
        {quest.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {quest.reward && <QuestReward reward={quest.reward} />}
        {quest.timeLimit && <QuestTimeLimit timeLimit={quest.timeLimit} />}
        {distance !== null && (
          <div className="flex items-center gap-1.5 rounded-lg border border-wood-light/30 bg-parchment px-3 py-2 dark:border-wood/30 dark:bg-wood-dark/50">
            <PixelIcon id={17} size={20} alt="Entfernung" />
            <span className="text-sm font-semibold text-medieval-text dark:text-medieval-text-light">
              {formatDistance(distance)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={openInfoPage}
        className="mt-2 w-full rounded-xl border-2 border-gold bg-wood py-3.5 font-pixel text-xs text-parchment-light shadow-lg transition-all active:scale-[0.98] active:bg-wood-dark"
      >
        Mehr Infos
      </button>
    </div>
  );
}
