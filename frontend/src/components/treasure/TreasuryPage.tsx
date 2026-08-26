import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Backpack, Flame, Gem, Hammer, Lock, ScrollText, Sparkles, X } from 'lucide-react';
import OverlayPage from '../common/OverlayPage';
import { useTreasureStore } from '../../stores/useTreasureStore';
import { useToastStore } from '../../stores/useToastStore';
import { RARITY_META, EFFECT_LABEL, TARGET_LABEL } from '../../constants/treasures';
import { craftItems } from '../../services/treasure.service';
import type {
  CraftingRecipeView,
  InventoryEntry,
  ItemHistoryEvent,
} from '../../types/treasure';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEffectValue(type: string, value: number): string {
  if (type === 'treasure_sense') return `+${Math.round(value)} m`;
  return `+${Math.round(value * 100)}%`;
}

function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const EVENT_LABEL: Record<ItemHistoryEvent['event'], string> = {
  found: 'Gefunden',
  stacked: 'Verstärkt',
  crafted: 'Geschmiedet',
  lucky_double: 'Doppelfund',
};

const EVENT_EMOJI: Record<ItemHistoryEvent['event'], string> = {
  found: '🧰',
  stacked: '⬆️',
  crafted: '🔨',
  lucky_double: '🍀',
};

// ─── Boni summary ────────────────────────────────────────────────────────────

function BonusCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-slate-50 py-2.5 dark:bg-slate-800/60">
      <span className="text-lg">{emoji}</span>
      <span className="text-sm font-black text-slate-800 dark:text-white">{value}</span>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

// ─── Item grid card ──────────────────────────────────────────────────────────

function ItemCard({ entry, onClick }: { entry: InventoryEntry; onClick: () => void }) {
  const meta = RARITY_META[entry.effectiveRarity];
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 rounded-2xl border-2 bg-white p-3 shadow-sm transition-all active:scale-95 dark:bg-slate-800"
      style={{ borderColor: meta.color, boxShadow: `0 0 10px ${meta.color}33` }}
    >
      <span className="text-3xl">{entry.item.emoji}</span>
      <span className="w-full truncate text-center text-[11px] font-bold text-slate-700 dark:text-slate-200">
        {entry.item.name}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: meta.color }}>
        {meta.label}
      </span>
      {entry.stackCount > 1 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900"
          style={{ backgroundColor: meta.color }}
        >
          ×{entry.stackCount}
        </span>
      )}
    </motion.button>
  );
}

// ─── Item detail sheet ───────────────────────────────────────────────────────

function ItemDetail({ entry, onClose }: { entry: InventoryEntry; onClose: () => void }) {
  const meta = RARITY_META[entry.effectiveRarity];
  const baseMeta = RARITY_META[entry.item.rarity];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: `${meta.color}22`, boxShadow: `0 0 14px ${meta.color}44` }}
          >
            {entry.item.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {entry.item.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: meta.color }}
              >
                {meta.label}
              </span>
              {entry.effectiveRarity !== entry.item.rarity && (
                <span className="text-[10px] font-medium text-slate-400">
                  (Basis: {baseMeta.label}, ×{entry.stackCount} gestapelt)
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {TARGET_LABEL[entry.item.target]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Effects */}
        <div className="mb-4 space-y-1.5">
          {entry.item.effects.map((effect, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
            >
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {EFFECT_LABEL[effect.type]}
                  {effect.type !== 'cosmetic' && (
                    <span className="ml-1" style={{ color: meta.color }}>
                      {formatEffectValue(effect.type, effect.value)}
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {effect.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lore */}
        <div className="mb-4 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <ScrollText className="h-3 w-3" /> Geschichte
          </span>
          <p className="text-xs italic leading-relaxed text-slate-600 dark:text-slate-300">
            {entry.item.lore}
          </p>
        </div>

        {/* Per-item acquisition history */}
        {entry.history.length > 0 && (
          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Deine Chronik
            </span>
            <div className="space-y-1.5">
              {[...entry.history].reverse().map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{EVENT_EMOJI[h.event]}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {EVENT_LABEL[h.event]}
                  </span>
                  {h.note && (
                    <span className="truncate text-slate-500 dark:text-slate-400">
                      — {h.note}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                    {formatEventDate(h.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Schmiede ────────────────────────────────────────────────────────────────

/**
 * The forge is deliberately always dark and warm — you step out of the
 * treasury and into a sooty workshop, in light mode as well as dark.
 */

/** Embers drifting up from the coal bed. */
function Embers() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => {
        const left = (i * 7 + (i % 3) * 11) % 96;
        const delay = (i % 7) * 0.55;
        const size = 2 + (i % 3);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-amber-400"
            style={{ left: `${left}%`, bottom: 0, width: size, height: size }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.9, 0], y: -150 - (i % 4) * 30, x: (i % 5) - 2 }}
            transition={{
              duration: 3.4 + (i % 4) * 0.7,
              delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

/** Sparks kicked up by a hammer blow. */
function Sparks({ strikeId }: { strikeId: number }) {
  if (strikeId === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI - Math.PI / 2;
        return (
          <motion.span
            key={`${strikeId}-${i}`}
            className="absolute h-1 w-1 rounded-full bg-amber-200"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * (40 + (i % 5) * 14),
              y: Math.sin(angle) * (34 + (i % 4) * 12),
              scale: 0.3,
            }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

/** The anvil the crafting slots sit on. */
function AnvilBody() {
  return (
    <svg viewBox="0 0 200 74" className="w-full max-w-[280px]" aria-hidden="true">
      <defs>
        <linearGradient id="anvilFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b6470" />
          <stop offset="55%" stopColor="#3a4048" />
          <stop offset="100%" stopColor="#23272d" />
        </linearGradient>
      </defs>
      {/* horn + face */}
      <path
        d="M8 14 Q26 10 44 13 L44 8 L156 8 L156 13 Q174 10 192 14 L192 20 Q170 22 152 22 L142 34 L58 34 L48 22 Q30 22 8 20 Z"
        fill="url(#anvilFace)"
      />
      {/* waist */}
      <path d="M78 34 L122 34 L128 52 L72 52 Z" fill="#2b3037" />
      {/* base */}
      <path d="M56 52 L144 52 L150 66 L50 66 Z" fill="#343a42" />
      {/* stump */}
      <rect x="62" y="66" width="76" height="8" rx="2" fill="#4a3524" />
      {/* highlight along the working face */}
      <path d="M44 9 L156 9" stroke="#8b95a3" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

function RecipeRow({
  recipe,
  onFill,
}: {
  recipe: CraftingRecipeView;
  onFill: (recipe: CraftingRecipeView) => void;
}) {
  const resultMeta = RARITY_META[recipe.result.rarity];
  return (
    <button
      onClick={() => recipe.unlocked && onFill(recipe)}
      disabled={!recipe.unlocked}
      className={`w-full rounded-xl border p-3 text-left transition-all ${
        recipe.craftable
          ? 'border-amber-400/70 bg-amber-500/10 shadow-[0_0_16px_-6px_rgba(245,158,11,0.7)]'
          : 'border-amber-900/40 bg-black/20'
      } ${recipe.unlocked ? 'active:scale-[0.99]' : 'opacity-60'}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: `${resultMeta.color}22` }}
        >
          {recipe.unlocked ? recipe.result.emoji : '❓'}
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-bold text-amber-50">
            {recipe.unlocked ? recipe.name : 'Geheimes Rezept'}
            {!recipe.unlocked && <Lock className="h-3.5 w-3.5 text-amber-200/50" />}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: resultMeta.color }}>
            {resultMeta.label}
          </span>
        </div>
        {recipe.craftable && (
          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-amber-950">
            Schmiedebereit
          </span>
        )}
      </div>

      {recipe.unlocked ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {recipe.ingredients.map((ing) => (
            <span
              key={ing.itemId}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                ing.owned >= ing.count
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'bg-black/30 text-amber-100/40'
              }`}
            >
              {ing.emoji} {ing.count}× ({ing.owned})
            </span>
          ))}
          <span className="text-amber-200/40">→</span>
          <span className="text-base">{recipe.result.emoji}</span>
        </div>
      ) : (
        <p className="mt-2 text-[11px] italic text-amber-100/45">
          {recipe.unlockHint}
        </p>
      )}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TreasuryPage() {
  const open = useTreasureStore((s) => s.treasuryOpen);
  const close = useTreasureStore((s) => s.closeTreasury);
  const inventory = useTreasureStore((s) => s.inventory);
  const recipes = useTreasureStore((s) => s.recipes);
  const refreshInventory = useTreasureStore((s) => s.fetchInventory);
  const refreshRecipes = useTreasureStore((s) => s.fetchRecipes);
  const showToast = useToastStore((s) => s.showToast);

  const [tab, setTab] = useState<'items' | 'forge'>('items');
  const [detail, setDetail] = useState<InventoryEntry | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [crafting, setCrafting] = useState(false);
  /** Bumped on every hammer blow to retrigger the strike + spark animation. */
  const [strikeId, setStrikeId] = useState(0);

  const items = useMemo(() => inventory?.items ?? [], [inventory]);
  const bonuses = inventory?.bonuses;

  // How many copies of an item are already reserved in the crafting slots.
  const slotCount = (itemId: string) =>
    slots.filter((id) => id === itemId).length;

  if (!open) return null;

  const addToSlots = (entry: InventoryEntry) => {
    if (slots.length >= 3) return;
    if (slotCount(entry.itemId) >= entry.stackCount) return;
    setSlots([...slots, entry.itemId]);
  };

  const fillFromRecipe = (recipe: CraftingRecipeView) => {
    const filled: string[] = [];
    for (const ing of recipe.ingredients) {
      for (let i = 0; i < ing.count; i++) filled.push(ing.itemId);
    }
    setSlots(filled.slice(0, 3));
    setTab('forge');
  };

  const handleCraft = async () => {
    setCrafting(true);
    setStrikeId((n) => n + 1);
    try {
      const result = await craftItems(slots);
      showToast(`🔨 ${result.entry.item.emoji} ${result.recipe.name} geschmiedet!`);
      setSlots([]);
      await Promise.all([refreshInventory(), refreshRecipes()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Schmieden fehlgeschlagen');
    } finally {
      setCrafting(false);
    }
  };

  const itemByIdFirst = (id: string) => items.find((i) => i.itemId === id);

  const isForge = tab === 'forge';

  return (
    <OverlayPage
      title="Ausrüstung"
      icon={
        <Backpack
          className={`h-6 w-6 ${isForge ? 'text-amber-400' : 'text-purple-500'}`}
          strokeWidth={2.2}
        />
      }
      onClose={close}
      tone={isForge ? 'dark' : 'default'}
      contentClassName={isForge ? 'max-w-none' : undefined}
      toolbar={
        <div
          className={`shrink-0 px-4 pt-4 ${isForge ? 'bg-[#17110d]' : ''}`}
        >
          <div
            className={`mx-auto flex w-full max-w-md gap-1.5 rounded-2xl p-1.5 ${
              isForge ? 'bg-black/40' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {(
              [
                { id: 'items', label: 'Schatzkammer', Icon: Gem },
                { id: 'forge', label: 'Schmiede', Icon: Hammer },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                    active
                      ? id === 'forge'
                        ? 'text-amber-950'
                        : 'text-slate-900 dark:text-white'
                      : isForge
                        ? 'text-amber-100/60 hover:text-amber-100/90'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="equipment-tab"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className={`absolute inset-0 rounded-xl shadow-sm ${
                        id === 'forge'
                          ? 'bg-amber-500'
                          : 'bg-white dark:bg-slate-700'
                      }`}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      <div>
        {/* Aggregated boni — the treasury's ledger, not the forge's */}
        {bonuses && !isForge && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            <BonusCard emoji="⚡" value={`+${Math.round((bonuses.xpBoost + bonuses.dragonXp) * 100)}%`} label="XP-Bonus" />
            <BonusCard emoji="🍀" value={`${Math.round(bonuses.luck * 100)}%`} label="Glück" />
            <BonusCard emoji="🧭" value={`+${Math.round(bonuses.treasureSenseMeters)}m`} label="Schatz-Sinn" />
            <BonusCard emoji="🧰" value={String(items.length)} label="Schätze" />
          </div>
        )}

        {tab === 'items' ? (
          items.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <span className="text-4xl">🗺️</span>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Noch keine Schätze
              </p>
              <p className="max-w-60 text-xs text-slate-400">
                Auf der Karte tauchen regelmäßig Schatztruhen auf — lauf hin und
                sammle sie ein!
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {items.map((entry) => (
                <ItemCard
                  key={entry.itemId}
                  entry={entry}
                  onClick={() => setDetail(entry)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="-mx-4 min-h-full space-y-6 px-4 pb-6">
            {/* The forge itself: coal bed, anvil, hammer */}
            <div className="relative -mx-4 overflow-hidden px-4 pb-8 pt-5">
              {/* Heat glow from the coals, faded back into the room at the
                  bottom so the forge has no visible seam. */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
                style={{
                  background:
                    'radial-gradient(ellipse 65% 90% at 50% 95%, rgba(249,115,22,0.38) 0%, rgba(180,48,8,0.15) 45%, transparent 72%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, #17110d 92%)',
                }}
              />
              <Embers />

              <div className="relative flex flex-col items-center">
                <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
                  Die Esse glüht
                </span>
                <p className="mb-4 text-xs text-amber-100/50">
                  Leg 2–3 Schätze auf den Amboss
                </p>

                {/* Slots resting on the anvil face */}
                <div className="relative flex w-full flex-col items-center">
                  <Sparks strikeId={strikeId} />
                  <motion.div
                    key={`slots-${strikeId}`}
                    animate={strikeId > 0 ? { y: [0, 4, 0] } : undefined}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="z-10 flex items-end gap-2"
                  >
                    {[0, 1, 2].map((i) => {
                      const entry = slots[i] ? itemByIdFirst(slots[i]) : undefined;
                      return (
                        <button
                          key={i}
                          onClick={() =>
                            slots[i] && setSlots(slots.filter((_, idx) => idx !== i))
                          }
                          className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl transition-all active:scale-95 ${
                            entry
                              ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_18px_-2px_rgba(251,146,60,0.8)]'
                              : 'border-dashed border-amber-200/25 bg-black/25 text-amber-100/30'
                          }`}
                          aria-label={
                            entry ? `${entry.item.name} vom Amboss nehmen` : 'Leerer Platz'
                          }
                        >
                          {entry?.item.emoji ?? '＋'}
                        </button>
                      );
                    })}
                  </motion.div>

                  {/* Anvil, tucked directly under the slots */}
                  <div className="-mt-1 flex w-full justify-center drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]">
                    <AnvilBody />
                  </div>
                </div>

                {/* Hammer */}
                <motion.button
                  onClick={handleCraft}
                  disabled={slots.length < 2 || crafting}
                  animate={crafting ? { rotate: [0, -22, 12, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="mt-5 flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-600 px-6 py-3.5 text-sm font-black uppercase tracking-wide text-amber-950 shadow-lg shadow-orange-900/50 transition-all active:scale-95 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  <Hammer className="h-5 w-5" />
                  {crafting ? 'Schlag…' : 'Schmieden'}
                </motion.button>
                <p className="mt-2 h-4 text-[11px] text-amber-100/40">
                  {slots.length < 2
                    ? `Noch ${2 - slots.length} Schatz${slots.length === 1 ? '' : 'e'} auflegen`
                    : `${slots.length} Schätze bereit`}
                </p>
              </div>
            </div>

            {/* Material crate */}
            {items.length > 0 && (
              <div className="rounded-2xl border border-amber-900/40 bg-black/25 p-3">
                <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400/70">
                  <Flame className="h-3 w-3" /> Materialkiste
                </span>
                <div className="flex flex-wrap gap-2">
                  {items.map((entry) => {
                    const used = slotCount(entry.itemId);
                    const exhausted =
                      used >= entry.stackCount || slots.length >= 3;
                    return (
                      <button
                        key={entry.itemId}
                        onClick={() => addToSlots(entry)}
                        disabled={exhausted}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-200/15 bg-amber-950/40 px-2.5 py-1.5 text-xs font-semibold text-amber-50 transition-all active:scale-95 disabled:opacity-35"
                      >
                        <span className="text-sm">{entry.item.emoji}</span>
                        {entry.item.name}
                        <span className="text-[10px] text-amber-200/50">
                          {entry.stackCount - used}×
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipe book */}
            <div>
              <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400/70">
                <ScrollText className="h-3 w-3" /> Schmiedebuch
              </span>
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <RecipeRow key={recipe.id} recipe={recipe} onFill={fillFromRecipe} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Item detail sheet */}
      <AnimatePresence>
        {detail && <ItemDetail entry={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </OverlayPage>
  );
}
