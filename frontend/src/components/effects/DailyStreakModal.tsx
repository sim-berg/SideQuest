import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStreakStore } from '../../stores/useStreakStore';

const FLAME_COLORS = ['#ff4500', '#ff6b00', '#ff8c00', '#ffa500', '#ffcc00'];

function Flames({ count = 18 }: { count?: number }) {
  const flames = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 5 + (i / count) * 90,
        delay: (i / count) * 0.8,
        duration: 0.9 + (i % 3) * 0.3,
        size: 28 + (i % 4) * 14,
        color: FLAME_COLORS[i % FLAME_COLORS.length],
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 overflow-hidden">
      {flames.map((f) => (
        <motion.div
          key={f.id}
          className="absolute bottom-0 select-none"
          style={{ left: `${f.left}%`, fontSize: f.size, color: f.color }}
          initial={{ y: 0, opacity: 0.6, scale: 0.8 }}
          animate={{ y: [-8, -24, -8], opacity: [0.7, 1, 0.7], scale: [0.9, 1.1, 0.9] }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🔥
        </motion.div>
      ))}
    </div>
  );
}

function FlameCounter({ streak }: { streak: number }) {
  const flames = Math.min(streak, 7);
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: flames }).map((_, i) => (
        <motion.span
          key={i}
          className="text-3xl"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 300 }}
        >
          🔥
        </motion.span>
      ))}
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 px-6 py-4"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xl font-black text-white">{value}</span>
      <span className="text-xs font-medium text-white/60 uppercase tracking-wide">{label}</span>
    </motion.div>
  );
}

export default function DailyStreakModal() {
  const { show, streak, totalXp, questsCompleted, dismiss } = useStreakStore();

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [show, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          className="fixed inset-0 z-[300] flex items-center justify-center px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 110%, #7c2d12 0%, #1c0a00 50%, rgba(0,0,0,0.92) 100%)' }}
        >
          <Flames count={22} />

          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-12 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,100,0,0.25) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.p
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xs font-bold uppercase tracking-[0.35em] text-orange-300"
            >
              Willkommen zurück
            </motion.p>

            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.15 }}
              className="relative"
            >
              <div className="text-[88px] leading-none drop-shadow-[0_0_32px_rgba(255,120,0,0.9)]">
                🔥
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
                className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white shadow-lg shadow-orange-900/60"
              >
                {streak}
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-3xl font-black text-white leading-tight"
            >
              {streak === 1
                ? 'Erster Tag!'
                : streak >= 7
                ? `${streak} Tage in Folge! 🏆`
                : `${streak} Tage Streak!`}
            </motion.h2>

            <FlameCounter streak={streak} />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="max-w-xs text-sm text-orange-200/80"
            >
              {streak === 1
                ? 'Dein Abenteuer beginnt – komm morgen wieder!'
                : streak >= 30
                ? 'Unaufhaltsam! Du bist eine Legende.'
                : streak >= 7
                ? 'Eine ganze Woche – weiter so, Held!'
                : 'Jeden Tag ein neues Abenteuer wartet auf dich.'}
            </motion.p>

            {/* Stats */}
            <div className="mt-2 flex gap-3">
              <StatBox label="Quests" value={questsCompleted} icon="⚔️" />
              <StatBox label="Total XP" value={totalXp.toLocaleString('de')} icon="⭐" />
              <StatBox label="Streak" value={`${streak}d`} icon="🔥" />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-2 text-xs text-white/30"
            >
              Tippen zum Schließen
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
