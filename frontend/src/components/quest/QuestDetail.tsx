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
    <div className="flex flex-col gap-4 bg-cyber-light-surface px-5 pb-8 dark:bg-cyber-surface">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-pixel text-sm leading-relaxed text-cyber-light-text dark:text-cyber-text">
          {quest.title}
        </h2>
        <CategoryBadge category={quest.category} />
      </div>

      <p className="text-sm leading-relaxed text-cyber-light-text-dim dark:text-cyber-text-dim">
        {quest.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {quest.reward && <QuestReward reward={quest.reward} />}
        {quest.timeLimit && <QuestTimeLimit timeLimit={quest.timeLimit} />}
        {distance !== null && (
          <div className="flex items-center gap-1.5 rounded-lg border border-cyber-light-border bg-cyber-light-card px-3 py-2 dark:border-cyber-border dark:bg-cyber-card">
            <PixelIcon id={17} size={20} alt="Entfernung" />
            <span className="text-sm font-semibold text-cyber-light-text dark:text-cyber-text">
              {formatDistance(distance)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={openInfoPage}
        className="neon-glow-cyan mt-2 w-full rounded-xl border border-neon-cyan bg-neon-cyan/10 py-3.5 font-pixel text-xs text-neon-cyan transition-all hover:bg-neon-cyan/20 active:scale-[0.98]"
      >
        Mehr Infos
      </button>
    </div>
  );
}
