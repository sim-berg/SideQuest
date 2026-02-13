import type { Quest } from '../../types/quest';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { useUIStore } from '../../stores/useUIStore';
import { formatDistance } from '../../utils/format';
import CategoryBadge from './CategoryBadge';
import QuestReward from './QuestReward';
import QuestTimeLimit from './QuestTimeLimit';

interface QuestDetailProps {
  quest: Quest;
}

export default function QuestDetail({ quest }: QuestDetailProps) {
  const distance = useQuestDistance(quest.lat, quest.lng);
  const openInfoPage = useUIStore((s) => s.openInfoPage);

  return (
    <div className="flex flex-col gap-4 bg-white px-5 pb-8 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {quest.title}
        </h2>
        <CategoryBadge category={quest.category} />
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {quest.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {quest.reward && <QuestReward reward={quest.reward} />}
        {quest.timeLimit && <QuestTimeLimit timeLimit={quest.timeLimit} />}
        {distance !== null && (
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
            <span className="text-lg">📍</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {formatDistance(distance)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={openInfoPage}
        className="mt-2 w-full rounded-xl bg-indigo-500 py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] active:bg-indigo-600"
      >
        Mehr Infos
      </button>
    </div>
  );
}
