import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gem, Hammer, Lock, ScrollText, Sparkles, X } from 'lucide-react';
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

// ─── Crafting (Schmiede) ─────────────────────────────────────────────────────

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
      className={`w-full rounded-2xl border p-3 text-left transition-all ${
        recipe.craftable
          ? 'border-emerald-400/70 bg-emerald-50/50 dark:bg-emerald-500/5'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60'
      } ${recipe.unlocked ? 'active:scale-[0.99]' : 'opacity-70'}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `${resultMeta.color}22` }}
        >
          {recipe.unlocked ? recipe.result.emoji : '❓'}
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
            {recipe.unlocked ? recipe.name : 'Geheimes Rezept'}
            {!recipe.unlocked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: resultMeta.color }}>
            {resultMeta.label}
          </span>
        </div>
        {recipe.craftable && (
          <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
            Bereit!
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
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {ing.emoji} {ing.count}× ({ing.owned})
            </span>
          ))}
          <span className="text-slate-400">→</span>
          <span className="text-base">{recipe.result.emoji}</span>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
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

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={close}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurück"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Schatzkammer
        </span>

        {/* Tab switch */}
        <div className="ml-auto flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setTab('items')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === 'items'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Gem className="h-3.5 w-3.5" /> Schätze
          </button>
          <button
            onClick={() => setTab('forge')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === 'forge'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Hammer className="h-3.5 w-3.5" /> Schmiede
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10">
        {/* Aggregated boni */}
        {bonuses && (
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
          <div className="mt-4 space-y-5">
            {/* Crafting slots */}
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Kombiniere 2–3 Items
              </span>
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => {
                  const entry = slots[i] ? itemByIdFirst(slots[i]) : undefined;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        slots[i] && setSlots(slots.filter((_, idx) => idx !== i))
                      }
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed text-2xl transition-all ${
                        entry
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      aria-label={entry ? `${entry.item.name} entfernen` : 'Leerer Slot'}
                    >
                      {entry?.item.emoji ?? '＋'}
                    </button>
                  );
                })}
                <button
                  onClick={handleCraft}
                  disabled={slots.length < 2 || crafting}
                  className="ml-auto flex h-14 items-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-bold text-white shadow-md shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-40"
                >
                  <Hammer className="h-4 w-4" />
                  {crafting ? '…' : 'Schmieden'}
                </button>
              </div>
            </div>

            {/* Own items as ingredient picker */}
            {items.length > 0 && (
              <div>
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Deine Materialien
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
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span className="text-sm">{entry.item.emoji}</span>
                        {entry.item.name}
                        <span className="text-[10px] text-slate-400">
                          {entry.stackCount - used}×
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipes */}
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Rezepte
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
    </div>
  );
}
