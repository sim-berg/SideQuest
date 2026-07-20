import { useCallback } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { Quest } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { useSideQuestStore } from '../../stores/useSideQuestStore';

interface SideQuestMarkerProps {
  quest: Quest;
  /** Play the spawn-pop animation (first time this quest appears). */
  isNew: boolean;
  /** Highlight the marker as a side quest the current user has accepted. */
  acceptedByMe?: boolean;
}

export default function SideQuestMarker({ quest, isNew, acceptedByMe }: SideQuestMarkerProps) {
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
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg ${
          acceptedByMe
            ? 'border-emerald-400 shadow-emerald-500/40 ring-4 ring-emerald-400/40'
            : 'border-amber-300 shadow-amber-500/40'
        }`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${meta.color}, #b45309)`,
        }}
      >
        <span className="text-lg drop-shadow">{meta.icon}</span>
        {acceptedByMe ? (
          /* Green check marks a side quest the user already accepted */
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
          </span>
        ) : (
          /* Sparkle badge marks it as a special side quest */
          <motion.span
            className="absolute -right-1 -top-1 text-sm"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
        )}
      </motion.div>
    </button>
  );
}
