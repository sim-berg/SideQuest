import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { usePetStore, selectActivePet } from '../../stores/usePetStore';
import {
  activatePet,
  renamePet,
  fetchPetImage,
  regeneratePetImage,
} from '../../services/pet.service';
import {
  ELEMENT_META,
  STAGE_LABELS,
  MOOD_META,
  RARITY_META,
  SPECIES_EMOJI,
  PORTRAIT_REGEN_COST,
} from '../../constants/pets';
import { useCoinStore } from '../../stores/useCoinStore';
import { useToastStore } from '../../stores/useToastStore';
import { CATEGORY_META } from '../../constants/categories';
import { getPetMood, getNextStageThreshold } from '../../utils/pet';
import PetAvatar from './PetAvatar';
import PetChat from './PetChat';
import PetEquipment from './PetEquipment';
import PetTradeSheet from './PetTradeSheet';
import { cn } from '../../utils/cn';

/**
 * Profile card for the active companion plus the menagerie strip: every pet
 * the user has collected, tap to make one the active guide.
 *
 * The portrait is a flip card: front shows the big generated picture with the
 * XP bar pinned to its bottom edge, tapping it turns the card around to the
 * soul status (alignment, Seelenwachstum, soul document).
 */
export default function PetDisplay() {
  const pets = usePetStore((s) => s.pets);
  const upsertPet = usePetStore((s) => s.upsertPet);
  const active = selectActivePet({ pets });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Lazily generate/fetch the portrait for the active pet's current stage.
  const activeId = active?.id;
  const needsImage = !!active?.species && !active.imageUrl;
  useEffect(() => {
    if (!activeId || !needsImage) return;
    let stale = false;
    fetchPetImage(activeId)
      .then((imageUrl) => {
        if (stale || !imageUrl) return;
        const current = usePetStore
          .getState()
          .pets.find((p) => p.id === activeId);
        if (current) {
          upsertPet({
            ...current,
            imageUrl,
            images: { ...current.images, [current.stage]: imageUrl },
          });
        }
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [activeId, needsImage, upsertPet]);

  // Always show the front again when the active companion changes.
  useEffect(() => setFlipped(false), [activeId]);

  if (!active) return null;

  const isEgg = !active.species;
  const element = active.element ? ELEMENT_META[active.element] : null;
  const color = element?.color ?? '#94a3b8';
  const mood = MOOD_META[getPetMood(active.lastQuestCompletedAt)];
  const threshold = getNextStageThreshold(active.xp);
  const progress = threshold
    ? Math.min(
        1,
        (active.xp - threshold.currentXp) /
          (threshold.nextXp - threshold.currentXp),
      )
    : 1;
  const nextStageLabel =
    STAGE_LABELS[
      isEgg ? 'hatchling' : (getStageAfter(active.stage) ?? active.stage)
    ];

  const soulEntries = Object.entries(active.soulXp ?? {}).sort(
    (a, b) => b[1] - a[1],
  );
  const soulMax = Math.max(1, ...soulEntries.map(([, v]) => v));
  const alignmentMeta = active.soulAlignment
    ? CATEGORY_META[active.soulAlignment as keyof typeof CATEGORY_META]
    : null;

  const handleActivate = async (id: string) => {
    if (id === active.id) return;
    try {
      upsertPet(await activatePet(id));
    } catch {
      /* ignore */
    }
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // the card underneath flips on click
    if (regenerating) return;
    setRegenerating(true);
    try {
      const imageUrl = await regeneratePetImage(active.id);
      if (imageUrl) {
        useCoinStore.getState().addCoins(-PORTRAIT_REGEN_COST);
        const current = usePetStore
          .getState()
          .pets.find((p) => p.id === active.id);
        if (current) {
          upsertPet({
            ...current,
            imageUrl,
            images: { ...current.images, [current.stage]: imageUrl },
          });
        }
      }
    } catch (err) {
      useToastStore.getState().addToast({
        type: 'error',
        title:
          err instanceof Error ? err.message : 'Neues Bild fehlgeschlagen',
        duration: 3500,
      });
    }
    setRegenerating(false);
  };

  const handleRename = async () => {
    setEditingName(false);
    const name = nameDraft.trim();
    if (!name || name === active.name) return;
    try {
      upsertPet(await renamePet(active.id, name));
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
      style={{ background: `linear-gradient(135deg, ${color}14, transparent 60%)` }}
    >
      {/* Portrait flip card */}
      <div className="[perspective:1200px]">
        <motion.div
          className={cn('relative aspect-square w-full', !isEgg && 'cursor-pointer')}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          onClick={() => !isEgg && setFlipped((f) => !f)}
        >
          {/* Front: the big portrait with the XP bar at its bottom edge */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]"
            style={{
              background: isEgg
                ? 'radial-gradient(circle at 35% 30%, #e2e8f088, #94a3b833)'
                : `radial-gradient(circle at 35% 30%, ${color}44, ${color}11)`,
            }}
          >
            {isEgg ? (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-[96px]">🥚</span>
              </div>
            ) : active.imageUrl ? (
              <img
                src={active.imageUrl}
                alt={active.name ?? active.speciesName ?? 'Gefährte'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span
                  className="text-[96px]"
                  style={{ filter: `drop-shadow(0 0 24px ${color})` }}
                >
                  {SPECIES_EMOJI[active.species!] ?? '🐾'}
                </span>
              </div>
            )}

            <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {isEgg ? 'Ei' : STAGE_LABELS[active.stage]}
            </div>
            {element && (
              <div
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-base backdrop-blur-sm"
                title={element.name}
              >
                {element.emoji}
              </div>
            )}
            {/* Hatchling portraits are shared per species+element — only
                unique portraits (Juvenile+) can be repainted. */}
            {!isEgg && active.stage !== 'hatchling' && active.imageUrl && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                title={`Bild neu erstellen (${PORTRAIT_REGEN_COST} Taler)`}
                aria-label={`Bild neu erstellen (${PORTRAIT_REGEN_COST} Taler)`}
                className="absolute right-3 top-12 flex h-8 items-center gap-1 rounded-full bg-black/45 px-2.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:bg-black/60 disabled:opacity-70"
              >
                <span className={cn('inline-block text-sm', regenerating && 'animate-spin')}>
                  🔄
                </span>
                {PORTRAIT_REGEN_COST} 🪙
              </button>
            )}

            {/* XP bar pinned to the bottom of the picture */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-3 pt-8">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/85">
                <span>{active.xp} XP</span>
                <span>
                  {threshold
                    ? `${threshold.nextXp} XP bis ${nextStageLabel}`
                    : 'Maximale Stufe'}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress * 100}%`, backgroundColor: color }}
                />
              </div>
              {!isEgg && (
                <p className="mt-1 text-center text-[10px] text-white/60">
                  Antippen für den Seelenstatus
                </p>
              )}
            </div>
          </div>

          {/* Back: the soul status */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl p-4 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ background: `linear-gradient(160deg, ${color}40, #0f172a 70%)` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
              Seelenstatus
            </p>
            {alignmentMeta && (
              <p className="mt-1.5 text-sm font-bold text-white">
                {alignmentMeta.icon} Gesinnung: {alignmentMeta.label}
              </p>
            )}

            {soulEntries.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1.5">
                {soulEntries.map(([cat, count]) => {
                  const catMeta =
                    CATEGORY_META[cat as keyof typeof CATEGORY_META];
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs">
                        {catMeta?.icon ?? '✨'}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(count / soulMax) * 100}%`,
                            backgroundColor: catMeta?.color ?? color,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-[10px] text-white/60">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/70">
                Die Seele deines Gefährten ist noch jung — schließe Quests ab,
                um sie zu formen.
              </p>
            )}

            <p className="mt-3 text-xs text-white/80">
              {mood.emoji} {mood.label}
              {active.currentStreak > 0 && (
                <> · 🔥 {active.currentStreak} Tage Streak</>
              )}
            </p>

            {active.soul && (
              <pre
                onClick={(e) => e.stopPropagation()}
                className="mt-3 min-h-0 flex-1 cursor-auto overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-sans text-[11px] leading-relaxed text-white/85"
              >
                {active.soul}
              </pre>
            )}

            <p className="mt-2 text-center text-[10px] text-white/50">
              Antippen zum Umdrehen
            </p>
          </div>
        </motion.div>
      </div>

      {/* Name + meta */}
      <div className="mt-3 min-w-0">
        {isEgg ? (
          <>
            <p className="font-bold text-slate-900 dark:text-white">
              Mysteriöses Ei
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Schließe alle Daily-Quests eines Tages ab, um es auszubrüten.
            </p>
          </>
        ) : (
          <>
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                maxLength={24}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            ) : (
              <button
                onClick={() => {
                  setNameDraft(active.name ?? '');
                  setEditingName(true);
                }}
                className="truncate text-left font-bold text-slate-900 dark:text-white"
              >
                {active.name || `${element?.name}-${active.speciesName}`}
                <span className="ml-1 text-xs font-normal text-slate-400">✏️</span>
              </button>
            )}
            <p className="text-xs font-semibold" style={{ color }}>
              {element?.name} · {active.speciesName}
              {active.rarity && (
                <span
                  className="ml-1.5"
                  style={{ color: RARITY_META[active.rarity].color }}
                >
                  {RARITY_META[active.rarity].label}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {STAGE_LABELS[active.stage]} · {mood.emoji} {mood.label}
              {active.currentStreak > 0 && (
                <span className="ml-1.5 text-orange-500">
                  🔥 {active.currentStreak} Tage
                </span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Equipment */}
      {!isEgg && <PetEquipment pet={active} />}

      {/* Chat + trade */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setChatOpen(true)}
          className="flex-[2] rounded-xl py-2.5 text-sm font-bold text-white shadow transition-all active:scale-[0.98]"
          style={{ backgroundColor: color }}
        >
          💬 {isEgg ? 'Dem Ei lauschen' : 'Sprechen'}
        </button>
        <button
          onClick={() => setTradeOpen(true)}
          className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-all active:scale-[0.98] dark:border-slate-600 dark:text-slate-300"
        >
          🔄 Tauschen
        </button>
      </div>
      {chatOpen && <PetChat pet={active} onClose={() => setChatOpen(false)} />}
      {tradeOpen && <PetTradeSheet onClose={() => setTradeOpen(false)} />}

      {/* Menagerie */}
      {pets.length > 1 && (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Menagerie
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleActivate(p.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all',
                  p.isActive
                    ? 'bg-slate-200/70 dark:bg-slate-700/70'
                    : 'opacity-70 hover:opacity-100',
                )}
              >
                <PetAvatar pet={p} size={44} />
                <span className="max-w-[64px] truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {p.species ? p.name || p.speciesName : 'Ei'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getStageAfter(stage: string): 'juvenile' | 'adult' | 'ancient' | null {
  if (stage === 'hatchling') return 'juvenile';
  if (stage === 'juvenile') return 'adult';
  if (stage === 'adult') return 'ancient';
  return null;
}
