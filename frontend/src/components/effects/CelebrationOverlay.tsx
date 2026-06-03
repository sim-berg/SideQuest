import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCelebrationStore, type Celebration } from '../../stores/useCelebrationStore';
import { DRAGON_META, EVOLUTION_LABELS } from '../../constants/dragons';
import { useDragonStore } from '../../stores/useDragonStore';

const CONFETTI_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#eab308',
];

function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-5%] rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
          }}
          initial={{ y: '-10vh', x: 0, rotate: p.rotate, opacity: 1 }}
          animate={{ y: '110vh', x: p.drift, rotate: p.rotate + 360, opacity: [1, 1, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

function Rays() {
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="h-[300vmax] w-[300vmax] shrink-0"
        style={{
          background:
            'repeating-conic-gradient(rgba(255,255,255,0.18) 0deg 8deg, transparent 8deg 16deg)',
        }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: [0, 0.6, 0.3], rotate: 90 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      />
    </div>
  );
}

function AcceptCard({ c }: { c: Celebration }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <Rays />
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 14 }}
        className="relative z-10 text-7xl"
      >
        ⚔️
      </motion.div>
      <motion.h2
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 mt-4 bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-3xl font-black uppercase tracking-wide text-transparent drop-shadow"
      >
        Quest angenommen!
      </motion.h2>
      {c.title && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 mt-2 max-w-xs text-base font-semibold text-white/90"
        >
          {c.title}
        </motion.p>
      )}
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setVal(Math.round(t * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{val}</>;
}

function CompleteCard({ c }: { c: Celebration }) {
  const xp = c.xpResult;
  return (
    <div className="relative flex flex-col items-center text-center">
      <Confetti />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' }}
        className="relative z-10 text-7xl"
      >
        🏆
      </motion.div>
      <motion.h2
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 mt-4 bg-gradient-to-r from-emerald-300 to-green-500 bg-clip-text text-4xl font-black uppercase tracking-wide text-transparent drop-shadow"
      >
        Geschafft!
      </motion.h2>
      {xp && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="relative z-10 mt-4 rounded-2xl bg-white/10 px-8 py-4 backdrop-blur"
        >
          <p className="text-5xl font-black text-amber-300 drop-shadow">
            +<CountUp to={xp.xpAwarded} /> XP
          </p>
          <div className="mt-2 space-y-0.5 text-xs text-white/70">
            <p>Basis: {xp.bonusBreakdown.baseXp} XP</p>
            {xp.bonusBreakdown.firstOfDayBonus > 0 && (
              <p>Tagesbonus: +{xp.bonusBreakdown.firstOfDayBonus} XP</p>
            )}
            {xp.bonusBreakdown.streak > 1 && (
              <p>
                Streak ×{xp.bonusBreakdown.streak} (+
                {Math.round((xp.bonusBreakdown.streakMultiplier - 1) * 100)}%)
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EvolutionCard({ c }: { c: Celebration }) {
  const dragon = useDragonStore((s) => s.dragon);
  const meta = dragon ? DRAGON_META[dragon.type] : null;
  const fromEmoji = meta && c.fromStage ? meta.emoji[c.fromStage] : '🥚';
  const toEmoji = meta && c.toStage ? meta.emoji[c.toStage] : '🐲';

  return (
    <div className="relative flex flex-col items-center text-center">
      <Rays />
      <Confetti count={60} />
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-xl font-bold uppercase tracking-widest text-amber-200"
      >
        Dein Drache entwickelt sich!
      </motion.h2>

      <div className="relative z-10 mt-6 flex items-center gap-4">
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: [1, 1.1, 0.6], opacity: [1, 1, 0.3] }}
          transition={{ duration: 1.2 }}
          className="text-6xl"
        >
          {fromEmoji}
        </motion.div>
        <motion.div
          animate={{ x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="text-3xl text-amber-300"
        >
          ➜
        </motion.div>
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
          animate={{ scale: [0.4, 1.4, 1], opacity: 1, rotate: 0 }}
          transition={{ delay: 0.9, duration: 0.9, type: 'spring', stiffness: 260 }}
          className="text-7xl drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]"
        >
          {toEmoji}
        </motion.div>
      </div>

      {c.toStage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="relative z-10 mt-6 text-2xl font-black text-white"
        >
          {EVOLUTION_LABELS[c.toStage]}
        </motion.p>
      )}
    </div>
  );
}

function AchievementCard({ c }: { c: Celebration }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <Rays />
      <Confetti count={70} />
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-sm font-bold uppercase tracking-[0.3em] text-amber-200"
      >
        Errungenschaft freigeschaltet
      </motion.p>

      <motion.div
        initial={{ scale: 0, rotate: -25, opacity: 0 }}
        animate={{ scale: [0, 1.25, 1], rotate: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 240 }}
        className="relative z-10 mt-5"
      >
        {c.imageUrl ? (
          <img
            src={c.imageUrl}
            alt={c.title ?? 'Achievement'}
            className="h-40 w-40 object-contain drop-shadow-[0_0_24px_rgba(251,191,36,0.85)]"
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-amber-400/20 text-7xl">
            🏅
          </div>
        )}
      </motion.div>

      {c.title && (
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 mt-5 text-2xl font-black text-white"
        >
          {c.title}
        </motion.h2>
      )}
      {c.description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 mt-1 max-w-xs text-sm text-white/80"
        >
          {c.description}
        </motion.p>
      )}
    </div>
  );
}

const DURATIONS: Record<Celebration['type'], number> = {
  accept: 2200,
  complete: 3200,
  evolution: 3800,
  achievement: 4000,
};

function CelebrationView({ c }: { c: Celebration }) {
  const dismiss = useCelebrationStore((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(c.id), DURATIONS[c.type]);
    return () => clearTimeout(t);
  }, [c.id, c.type, dismiss]);

  return (
    <motion.div
      key={c.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => dismiss(c.id)}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
    >
      {c.type === 'accept' && <AcceptCard c={c} />}
      {c.type === 'complete' && <CompleteCard c={c} />}
      {c.type === 'evolution' && <EvolutionCard c={c} />}
      {c.type === 'achievement' && <AchievementCard c={c} />}
    </motion.div>
  );
}

export default function CelebrationOverlay() {
  const queue = useCelebrationStore((s) => s.queue);
  const current = queue[0];

  return (
    <AnimatePresence>
      {current && <CelebrationView c={current} />}
    </AnimatePresence>
  );
}
