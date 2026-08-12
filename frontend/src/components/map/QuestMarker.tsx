import { useCallback } from 'react';
import { Check } from 'lucide-react';
import type { Category } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { useQuestStore } from '../../stores/useQuestStore';

interface QuestMarkerProps {
  questId: string;
  category: Category;
  /** Highlight the marker as a quest the current user has accepted. */
  acceptedByMe?: boolean;
}

export default function QuestMarker({ questId, category, acceptedByMe }: QuestMarkerProps) {
  const quests = useQuestStore((s) => s.quests);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const meta = CATEGORY_META[category];

  // Clicking a marker shows the compact peek card (QuestPeekCard) over the
  // marker. The full detail screen is opened from that card.
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const quest = quests.find((q) => q.id === questId);
      if (quest) selectQuest(quest);
    },
    [questId, quests, selectQuest],
  );

  return (
    <button
      onClick={handleClick}
      className="relative flex cursor-pointer items-center justify-center transition-transform hover:scale-110 active:scale-95"
      aria-label={`Quest: ${meta.label}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg ${
          acceptedByMe ? 'border-emerald-400 ring-4 ring-emerald-400/40' : 'border-white'
        }`}
        style={{ backgroundColor: meta.color }}
      >
        <span className="text-lg">{meta.icon}</span>
      </div>
      {acceptedByMe && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}
