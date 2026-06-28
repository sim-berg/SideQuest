import { useCallback } from 'react';
import { motion } from 'motion/react';
import type { Quest } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { useSideQuestStore } from '../../stores/useSideQuestStore';

interface SideQuestMarkerProps {
  quest: Quest;
  /** Play the spawn-pop animation (first time this quest appears). */
  isNew: boolean;
}

export default function SideQuestMarker({ quest, isNew }: SideQuestMarkerProps) {
  const setSelected = useSideQuestStore((s) => s.setSelected);
  const meta = CATEGORY_META[quest.category];

  // Clicking a marker shows the compact peek card first (setSelected leaves
  // detailOpen=false). The full-screen detail is opened from that card.
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelected(quest);
    },
    [quest, setSelected],
  );

  return (
    <button
      onClick={handleClick}
      className="relative flex cursor-pointer items-center justify-center"
      aria-label={`SideQuest: ${quest.title}`}
    >
      {/* Pulsing aura ring */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />

      {/* Marker body — spawn pop on first appearance */}
      <motion.div
        initial={isNew ? { scale: 0, y: -24, rotate: -30 } : false}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-300 shadow-lg shadow-amber-500/40"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${meta.color}, #b45309)`,
        }}
      >
        <span className="text-lg drop-shadow">{meta.icon}</span>
        {/* Sparkle badge marks it as a special side quest */}
        <motion.span
          className="absolute -right-1 -top-1 text-sm"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ✨
        </motion.span>
      </motion.div>
    </button>
  );
}
