import { useState } from 'react';
import { motion } from 'motion/react';
import { useLogbookStore } from '../../stores/useLogbookStore';

const SEEN_KEY = 'sidequest_egg_intro_seen';

export function hasSeenEggIntro(): boolean {
  return localStorage.getItem(SEEN_KEY) === '1';
}

/**
 * One-time welcome for new adventurers: instead of picking a dragon they now
 * receive a mystery egg that hatches once the first daily board is cleared.
 */
export default function EggIntro() {
  const [dismissed, setDismissed] = useState(false);
  const openLogbook = useLogbookStore((s) => s.openLogbook);

  const close = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 px-8 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative"
      >
        <motion.span
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="block text-8xl drop-shadow-[0_0_40px_rgba(148,163,184,0.5)]"
        >
          🥚
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="absolute -right-3 -top-2 text-2xl"
        >
          ✨
        </motion.span>
      </motion.div>

      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-8 text-2xl font-black text-white"
      >
        Du hast ein mysteriöses Ei erhalten!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300"
      >
        In diesem Ei schlummert dein zukünftiger Gefährte — ein Elementarwesen,
        dessen Art und Element sich nach dir richten. Schließe alle heutigen
        Daily-Quests im Logbuch ab, dann schlüpft es.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-8 flex w-full max-w-xs flex-col gap-2"
      >
        <button
          onClick={() => {
            close();
            openLogbook();
          }}
          className="w-full rounded-xl bg-indigo-500 py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] active:bg-indigo-600"
        >
          📜 Zu den Daily-Quests
        </button>
        <button
          onClick={close}
          className="w-full rounded-xl py-3 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
        >
          Später
        </button>
      </motion.div>
    </div>
  );
}
