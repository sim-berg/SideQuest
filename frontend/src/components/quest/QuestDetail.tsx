import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import type { Quest } from '../../types/quest';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { formatDistance } from '../../utils/format';
import { toSlug } from '../../utils/slug';
import { fetchQuestImage } from '../../services/quest.service';
import { CATEGORY_META } from '../../constants/categories';
import CategoryBadge from './CategoryBadge';
import QuestReward from './QuestReward';
import QuestTimeLimit from './QuestTimeLimit';

interface QuestDetailProps {
  quest: Quest;
}

export default function QuestDetail({ quest }: QuestDetailProps) {
  const distance = useQuestDistance(quest.lat, quest.lng);
  const [, navigate] = useLocation();
  const meta = CATEGORY_META[quest.category];

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImageUrl(null);
    setImgReady(false);
    fetchQuestImage(quest.id)
      .then((url) => { if (!cancelled) setImageUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [quest.id]);

  return (
    <div className="flex flex-col gap-4 bg-white px-5 pb-8 dark:bg-slate-900">
      {/* Hero: AI-generated scene over a category-tinted gradient */}
      <div
        className="relative -mx-5 -mt-2 aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${meta.color}, ${meta.color}99 55%, #0f172a)`,
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={quest.title}
            onLoad={() => setImgReady(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              imgReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        {!imgReady && (
          <div className="absolute inset-0 animate-pulse bg-white/10" />
        )}

        {/* Readability scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {/* Badges */}
        {quest.isSideQuest && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-xs font-bold text-amber-950 shadow-lg shadow-amber-900/30 backdrop-blur">
            ✨ SideQuest
          </span>
        )}
        <div className="absolute right-3 top-3">
          <CategoryBadge category={quest.category} />
        </div>

        {/* Title overlaid on the image */}
        <h2 className="absolute inset-x-4 bottom-3 text-xl font-bold leading-tight text-white drop-shadow-lg">
          {quest.title}
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {quest.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {quest.reward && <QuestReward reward={quest.reward} />}
        {quest.timeLimit && <QuestTimeLimit timeLimit={quest.timeLimit} />}
        {distance !== null && (
          <div className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 px-3 py-2 ring-1 ring-indigo-500/20 dark:from-indigo-500/20 dark:to-fuchsia-500/20">
            <span className="text-lg">📍</span>
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {formatDistance(distance)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(`/quest/${toSlug(quest.title, quest.id)}`)}
        className="mt-1 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] active:brightness-95"
      >
        Mehr Infos →
      </button>
    </div>
  );
}
