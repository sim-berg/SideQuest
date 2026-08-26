import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCelebrationStore, type Celebration } from '../../stores/useCelebrationStore';
import {
  ELEMENT_META,
  SPECIES_EMOJI,
  STAGE_LABELS,
  RARITY_META,
} from '../../constants/pets';
import { usePetStore, selectActivePet } from '../../stores/usePetStore';
import { fetchPetImage } from '../../services/pet.service';

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

/** Minimum time the transformation runs before revealing (ms). */
const EVOLUTION_MIN_CHARGE_MS = 3200;
/** Give up waiting for the generated portrait after this long (ms). */
const EVOLUTION_MAX_WAIT_MS = 25_000;
/** How long the reveal stays on screen before auto-dismiss (ms). */
const EVOLUTION_REVEAL_MS = 4200;

/**
 * Shared pacing for the hatch + evolution ceremonies: fetch and preload the
 * pet's freshly generated portrait, hold the build-up phase for at least
 * `minMs` (so the animation gets its moment even on a cache hit), give up
 * after `maxMs` (emoji fallback), and push the URL into the pet store so the
 * rest of the UI picks it up.
 */
function usePortraitReveal(
  petId: string | undefined,
  minMs: number,
  maxMs: number,
) {
  const [phase, setPhase] = useState<'waiting' | 'reveal'>('waiting');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    const reveal = (url: string | null) => {
      if (cancelled) return;
      const wait = Math.max(0, minMs - (Date.now() - started));
      setTimeout(() => {
        if (cancelled) return;
        setImageUrl(url);
        setPhase('reveal');
      }, wait);
    };

    const bailout = setTimeout(() => reveal(null), maxMs);
    if (!petId) {
      reveal(null);
    } else {
      fetchPetImage(petId)
        .then(
          (url) =>
            new Promise<string | null>((resolve) => {
              if (!url) return resolve(null);
              const img = new Image();
              img.onload = () => resolve(url);
              img.onerror = () => resolve(null);
              img.src = url;
            }),
        )
        .then((url) => {
          clearTimeout(bailout);
          if (url) {
            const store = usePetStore.getState();
            const current = store.pets.find((p) => p.id === petId);
            if (current) {
              store.upsertPet({
                ...current,
                imageUrl: url,
                images: { ...current.images, [current.stage]: url },
              });
            }
          }
          reveal(url);
        })
        .catch(() => {
          clearTimeout(bailout);
          reveal(null);
        });
    }
    return () => {
      cancelled = true;
      clearTimeout(bailout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  return { phase, imageUrl };
}

/**
 * The evolution ceremony. Phase 1 "charging": the companion is wrapped in a
 * spinning elemental aura while its new, soul-infused portrait is being
 * generated server-side — the animation loops as long as that takes (the
 * backend pre-generates on evolution, so usually just a few seconds).
 * Phase 2 "reveal": white flash, then the one-of-a-kind portrait scales in.
 */
function EvolutionCard({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const pet = usePetStore((s) => selectActivePet(s));

  const speciesEmoji = (pet?.species && SPECIES_EMOJI[pet.species]) || '🐾';
  const element = pet?.element ? ELEMENT_META[pet.element] : null;
  const color = element?.color ?? '#fbbf24';
  const petId = c.petId ?? pet?.id;
  // The pre-evolution look: the previous stage's portrait, if it had one.
  const oldImage = (c.fromStage && pet?.images?.[c.fromStage]) || null;
  const isUnique = c.toStage !== 'hatchling';

  const { phase, imageUrl } = usePortraitReveal(
    petId,
    EVOLUTION_MIN_CHARGE_MS,
    EVOLUTION_MAX_WAIT_MS,
  );

  // Linger on the reveal, then hand control back to the queue.
  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = setTimeout(onDone, EVOLUTION_REVEAL_MS);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  return (
    <div className="relative flex flex-col items-center text-center">
      {phase === 'reveal' && <Rays />}
      {phase === 'reveal' && <Confetti count={70} />}

      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-xl font-bold uppercase tracking-widest text-amber-200"
      >
        {phase === 'waiting'
          ? 'Dein Gefährte verwandelt sich…'
          : 'Entwicklung abgeschlossen!'}
      </motion.h2>

      <div className="relative z-10 mt-8 flex h-52 w-52 items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 'waiting' ? (
            <motion.div
              key="charging"
              exit={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 0.35 }}
              className="relative flex h-full w-full items-center justify-center"
            >
              {/* spinning elemental aura */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${color}00, ${color}cc, ${color}00 60%)`,
                  filter: 'blur(6px)',
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-3 rounded-full"
                style={{
                  background: `conic-gradient(${color}00 30%, ${color}88, ${color}00 80%)`,
                  filter: 'blur(10px)',
                }}
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
              />
              {/* orbiting sparks */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 2 + i * 0.35,
                    ease: 'linear',
                  }}
                >
                  <span
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: color,
                      transform: `translateX(${64 + i * 9}px)`,
                      boxShadow: `0 0 10px ${color}`,
                    }}
                  />
                </motion.span>
              ))}
              {/* the companion, pulsing inside the storm */}
              <motion.div
                animate={{ scale: [1, 1.12, 0.96, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full"
                style={{ boxShadow: `0 0 40px ${color}aa` }}
              >
                {oldImage ? (
                  <img
                    src={oldImage}
                    alt=""
                    className="h-full w-full object-cover brightness-110"
                  />
                ) : (
                  <span className="text-7xl">{speciesEmoji}</span>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="reveal"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 220 }}
              className="relative flex h-full w-full items-center justify-center"
            >
              {/* white flash on entry */}
              <motion.div
                className="pointer-events-none fixed inset-0 bg-white"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-48 w-48 rounded-full object-cover"
                  style={{ boxShadow: `0 0 46px ${color}` }}
                />
              ) : (
                <span
                  className="text-8xl"
                  style={{ filter: `drop-shadow(0 0 24px ${color})` }}
                >
                  {speciesEmoji}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'reveal' && c.toStage && (
        <>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 mt-6 text-2xl font-black text-white"
          >
            {STAGE_LABELS[c.toStage]}
          </motion.p>
          {isUnique && imageUrl && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="relative z-10 mt-2 max-w-xs text-sm text-white/80"
            >
              ✨ Ein einzigartiges Porträt — geformt von seinen Abenteuern mit
              dir.
            </motion.p>
          )}
        </>
      )}
    </div>
  );
}

/** Minimum time the egg trembles before it cracks (ms). */
const HATCH_MIN_INCUBATE_MS = 2800;
/** Give up waiting for the hatchling portrait after this long (ms). */
const HATCH_MAX_WAIT_MS = 25_000;
/** How long the hatched reveal stays on screen before auto-dismiss (ms). */
const HATCH_REVEAL_MS = 5200;

/**
 * The hatch ceremony. The egg trembles and glows for as long as the
 * hatchling portrait takes to arrive (shared cache per element×species, so
 * usually just seconds), then cracks open in a white flash and reveals the
 * generated picture instead of the old emoji.
 */
function HatchCard({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const pet = c.pet;
  const element = pet?.element ? ELEMENT_META[pet.element] : null;
  const color = element?.color ?? '#fbbf24';
  const speciesEmoji =
    (pet?.species && SPECIES_EMOJI[pet.species]) || '🐾';
  const rarity = pet?.rarity ? RARITY_META[pet.rarity] : null;

  const { phase, imageUrl } = usePortraitReveal(
    pet?.id,
    HATCH_MIN_INCUBATE_MS,
    HATCH_MAX_WAIT_MS,
  );

  // Linger on the reveal, then hand control back to the queue.
  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = setTimeout(onDone, HATCH_REVEAL_MS);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  return (
    <div className="relative flex flex-col items-center text-center">
      {phase === 'reveal' && <Rays />}
      {phase === 'reveal' && <Confetti count={90} />}

      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-sm font-bold uppercase tracking-[0.3em] text-amber-200"
      >
        Dein Ei schlüpft!
      </motion.p>

      <div className="relative z-10 mt-6 flex h-52 w-52 items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 'waiting' ? (
            <motion.div
              key="egg"
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.3 }}
              className="relative flex h-full w-full items-center justify-center"
            >
              {/* pulsing elemental glow behind the egg */}
              <motion.div
                className="absolute inset-4 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${color}66, transparent 70%)`,
                  filter: 'blur(8px)',
                }}
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              />
              {/* trembling egg — loops until the portrait is ready */}
              <motion.span
                className="relative text-8xl"
                animate={{
                  rotate: [0, -7, 7, -10, 10, -4, 4, 0],
                  y: [0, -3, 0, -5, 0, -2, 0, 0],
                }}
                transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
              >
                🥚
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="hatched"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 220 }}
              className="relative flex h-full w-full items-center justify-center"
            >
              {/* white flash as the shell bursts */}
              <motion.div
                className="pointer-events-none fixed inset-0 bg-white"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-48 w-48 rounded-full object-cover"
                  style={{ boxShadow: `0 0 46px ${color}` }}
                />
              ) : (
                <span
                  className="text-8xl"
                  style={{ filter: `drop-shadow(0 0 28px ${color})` }}
                >
                  {speciesEmoji}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'waiting' && (
        <motion.p
          className="relative z-10 mt-5 text-sm text-white/70"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          Es klopft von innen…
        </motion.p>
      )}

      {phase === 'reveal' && pet && (
        <>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 mt-5 text-3xl font-black text-white"
          >
            {element?.name}-{pet.speciesName}
          </motion.h2>
          {rarity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="relative z-10 mt-1 text-sm font-bold uppercase tracking-widest"
              style={{ color: rarity.color }}
            >
              {rarity.label}
            </motion.p>
          )}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="relative z-10 mt-3 max-w-xs text-sm text-white/80"
          >
            {element?.emoji} Dein Gefährte wird dich von nun an auf allen
            Quests begleiten.
          </motion.p>
        </>
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
  hatch: 5200,
};

function CelebrationView({ c }: { c: Celebration }) {
  const dismiss = useCelebrationStore((s) => s.dismiss);

  useEffect(() => {
    // Hatch + evolution ceremonies pace themselves (they wait for the
    // generated portrait); every other celebration gets the fixed timer.
    if (c.type === 'evolution' || c.type === 'hatch') return;
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
      {c.type === 'evolution' && (
        <EvolutionCard c={c} onDone={() => dismiss(c.id)} />
      )}
      {c.type === 'achievement' && <AchievementCard c={c} />}
      {c.type === 'hatch' && <HatchCard c={c} onDone={() => dismiss(c.id)} />}
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
