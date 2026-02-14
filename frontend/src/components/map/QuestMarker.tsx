import { useCallback } from 'react';
import type { Category } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { useQuestStore } from '../../stores/useQuestStore';
import { useUIStore } from '../../stores/useUIStore';
import PixelIcon from '../common/PixelIcon';

interface QuestMarkerProps {
  questId: string;
  category: Category;
}

export default function QuestMarker({ questId, category }: QuestMarkerProps) {
  const quests = useQuestStore((s) => s.quests);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const openBottomSheet = useUIStore((s) => s.openBottomSheet);
  const meta = CATEGORY_META[category];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const quest = quests.find((q) => q.id === questId);
      if (quest) {
        selectQuest(quest);
        openBottomSheet();
      }
    },
    [questId, quests, selectQuest, openBottomSheet],
  );

  return (
    <button
      onClick={handleClick}
      className="flex cursor-pointer items-center justify-center transition-transform hover:scale-110 active:scale-95"
      aria-label={`Quest: ${meta.label}`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-gold/80 shadow-lg"
        style={{ backgroundColor: meta.color }}
      >
        <PixelIcon id={23} size={28} alt="Quest" />
      </div>
    </button>
  );
}
