import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import QuestDetail from './QuestDetail';

/**
 * Full-screen quest detail modal shown when a quest marker is tapped.
 * Replaces the old slide-up bottom sheet — matches the SideQuest detail
 * screen so both marker types open the same modal style.
 */
export default function QuestBottomSheet() {
  const isOpen = useUIStore((s) => s.bottomSheetOpen);
  const close = useUIStore((s) => s.closeBottomSheet);
  const selectedQuest = useQuestStore((s) => s.selectedQuest);
  const selectQuest = useQuestStore((s) => s.selectQuest);

  const handleClose = () => {
    close();
    selectQuest(null);
  };

  const open = isOpen && !!selectedQuest;

  return (
    <AnimatePresence>
      {open && selectedQuest && (
        <motion.div
          key="quest-modal"
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 14 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="fixed inset-0 z-[95] flex flex-col bg-white dark:bg-slate-900"
        >
          {/* top bar */}
          <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Quest
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-10 pt-2">
            <QuestDetail quest={selectedQuest} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
