import { useMemo, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from 'motion/react';
import { MapPin, Clock, Compass, Check } from 'lucide-react';
import { Category } from '../../types/quest';
import type { Quest } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { useUIStore } from '../../stores/useUIStore';
import { useMapStore } from '../../stores/useMapStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useSideQuestActions } from '../../hooks/useSideQuestActions';
import { useQuestActions } from '../../hooks/useQuestActions';
import { useNearbySideQuests, type NearbyQuest } from '../../hooks/useNearbySideQuests';
import { formatDistance, formatTimeRemaining } from '../../utils/format';
import { cn } from '../../utils/cn';

const ALL_CATEGORIES = Object.values(Category);
/** Three per row — keep it to three tidy rows. */
const MAX_CARDS = 9;

/** Older quests come back without a category/difficulty — don't crash on them. */
const FALLBACK_CATEGORY = { label: 'Quest', color: '#64748b', icon: '📜' };
const FALLBACK_DIFFICULTY = { label: 'Mittel', color: '#eab308', xp: 50 };

// ─── Trigger: the wordmark doubles as the sheet handle ────────────────────────

/**
 * The "SideQuest" wordmark in the top bar, shaped like an iPhone notch. Tap
 * toggles the sheet, a downward drag pulls it open — same gesture language as
 * a bottom sheet, mirrored.
 */
export function NextQuestsTrigger() {
  const open = useUIStore((s) => s.topSheetOpen);
  const toggleTopSheet = useUIStore((s) => s.toggleTopSheet);
  const setTopSheetOpen = useUIStore((s) => s.setTopSheetOpen);

  // Pan instead of drag: the notch is welded to the top edge, so pulling it
  // stretches it downward rather than sliding it away and baring the screen
  // behind it.
  const pull = useMotionValue(0);
  // Grow the padding, not a scale — stretching the box would smear the text.
  const paddingBottom = useTransform(
    pull,
    (v) => `${8 + Math.min(Math.max(v, 0), 90) * 0.22}px`,
  );

  const handlePan = (_: unknown, info: PanInfo) => {
    pull.set(Math.max(0, info.offset.y));
  };

  const handlePanEnd = (_: unknown, info: PanInfo) => {
    animate(pull, 0, { type: 'spring', stiffness: 500, damping: 32 });
    if (info.offset.y > 24 || info.velocity.y > 400) setTopSheetOpen(true);
  };

  return (
    <motion.button
      onClick={toggleTopSheet}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      style={{ paddingBottom }}
      className={cn(
        // Hangs off the top edge like an iPhone notch: square at the top,
        // deeply rounded where it drops into the screen.
        'group relative -mt-2 flex cursor-grab flex-col items-center gap-1 self-start rounded-b-[1.75rem]',
        'bg-slate-900/92 px-6 pt-3 pb-2 shadow-lg shadow-slate-950/30 ring-1 ring-white/10 backdrop-blur-xl',
        'transition-colors duration-300 active:cursor-grabbing',
        'dark:bg-slate-950/92 dark:ring-white/[0.08]',
      )}
      aria-expanded={open}
      aria-label="Quests in der Nähe"
    >
      {/* glass highlight along the notch shoulders */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-lg font-black tracking-tight text-transparent">
        SideQuest
      </span>
      {/* grabber */}
      <span
        className={cn(
          'h-1 w-8 rounded-full bg-white/25 transition-all duration-300 group-hover:w-11 group-hover:bg-white/45',
          open && 'w-11 bg-white/45',
        )}
      />
    </motion.button>
  );
}

// ─── Category pills ───────────────────────────────────────────────────────────

function CategoryPills({
  value,
  onChange,
}: {
  value: Category | null;
  onChange: (cat: Category | null) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
          value === null
            ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
            : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 dark:text-slate-400',
        )}
      >
        Alle
      </button>
      {ALL_CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const active = value === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(active ? null : cat)}
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200',
              active
                ? 'text-white shadow-sm'
                : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 dark:text-slate-400',
            )}
            style={active ? { backgroundColor: meta.color } : undefined}
          >
            <span className="text-[11px]">{meta.icon}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Quest card ───────────────────────────────────────────────────────────────

/**
 * One quest as a collectible playing card: category tint, difficulty and XP in
 * the corners like a mana cost, the icon as the artwork, and the two moves you
 * can make on it at the bottom.
 */
function QuestCard({
  entry,
  featured,
  onSelect,
}: {
  entry: NearbyQuest;
  featured: boolean;
  onSelect: (quest: Quest) => void;
}) {
  const { quest, distance } = entry;
  const meta = CATEGORY_META[quest.category] ?? FALLBACK_CATEGORY;
  const diff = DIFFICULTY_META[quest.difficulty] ?? FALLBACK_DIFFICULTY;

  // Both hooks run every render (hook order stays fixed); the one that doesn't
  // match this quest gets null and stays inert.
  const sideActions = useSideQuestActions(quest.isSideQuest ? quest : null);
  const questActions = useQuestActions(quest.isSideQuest ? null : quest);
  const { loading, isAcceptedByMe, accept, complete } = quest.isSideQuest
    ? sideActions
    : questActions;

  const xp = quest.reward ?? diff.xp;
  const takenByOther = !!quest.acceptedBy && !isAcceptedByMe;

  return (
    <div
      className={cn(
        'group relative flex min-h-[188px] flex-col overflow-hidden rounded-2xl border',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10',
        featured
          ? 'sq-shimmer border-amber-300 bg-amber-50/80 ring-1 ring-amber-300/50 dark:border-amber-400/40 dark:bg-amber-400/10'
          : 'border-slate-200/80 bg-white/70 hover:border-indigo-300 dark:border-slate-700/70 dark:bg-slate-800/60 dark:hover:border-indigo-400/50',
      )}
    >
      {/* category tint + top edge, the card's "suit" */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(165deg, ${meta.color}26 0%, transparent 58%)`,
        }}
      />
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: meta.color }}
      />

      {/* corners: rank + cost */}
      <div className="relative flex items-start justify-between gap-1 px-1.5 pt-2">
        {featured ? (
          <span className="rounded-full bg-amber-400 px-1.5 py-px text-[8px] font-black uppercase tracking-wide text-amber-950">
            Nächste
          </span>
        ) : (
          <span
            className="rounded-full bg-white/70 px-1.5 py-px text-[8px] font-black uppercase tracking-wide dark:bg-slate-900/50"
            style={{ color: diff.color }}
          >
            {diff.label}
          </span>
        )}
        <span className="rounded-full bg-slate-900/85 px-1.5 py-px text-[8px] font-black text-white dark:bg-white/15">
          {xp} XP
        </span>
      </div>

      {/* artwork */}
      <div className="relative flex flex-1 items-center justify-center py-1">
        <span
          className="absolute h-11 w-11 rounded-full blur-md"
          style={{ backgroundColor: `${meta.color}40` }}
        />
        <span className="relative text-3xl transition-transform duration-200 group-hover:scale-110">
          {meta.icon}
        </span>
      </div>

      {/* name plate */}
      <div className="relative px-2">
        <h4 className="line-clamp-2 text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
          {quest.title}
        </h4>
        {(distance !== null || quest.expiresAt) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
            {distance !== null && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" /> {formatDistance(distance)}
              </span>
            )}
            {quest.expiresAt && (
              <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-300">
                <Clock className="h-2.5 w-2.5" /> {formatTimeRemaining(quest.expiresAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* moves */}
      <div className="relative mt-1.5 flex flex-col gap-1 p-1.5">
        <button
          onClick={isAcceptedByMe ? complete : accept}
          disabled={loading || takenByOther}
          className={cn(
            'flex items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold text-white shadow-sm transition-all duration-200',
            'disabled:cursor-not-allowed disabled:opacity-40',
            isAcceptedByMe
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-indigo-500 hover:bg-indigo-600 hover:shadow-indigo-500/30',
          )}
        >
          {isAcceptedByMe && <Check className="h-3 w-3" />}
          {loading ? '...' : isAcceptedByMe ? 'Fertig' : takenByOther ? 'Vergeben' : 'Annehmen'}
        </button>
        <button
          onClick={() => onSelect(quest)}
          className="rounded-lg bg-slate-500/10 py-1 text-[10px] font-bold text-slate-600 transition-colors duration-200 hover:bg-slate-500/20 dark:text-slate-300"
        >
          Details
        </button>
      </div>
    </div>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

/**
 * Top sheet dropping out of the wordmark: a minimal category filter plus the
 * player's nearest quests as a hand of cards. Drag it up (or tap outside) to
 * dismiss.
 */
export default function NextQuestsSheet() {
  const open = useUIStore((s) => s.topSheetOpen);
  const setTopSheetOpen = useUIStore((s) => s.setTopSheetOpen);
  const setViewState = useMapStore((s) => s.setViewState);
  const viewState = useMapStore((s) => s.viewState);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const setSelectedSideQuest = useSideQuestStore((s) => s.setSelected);

  const [category, setCategory] = useState<Category | null>(null);
  const nearby = useNearbySideQuests();

  const filtered = useMemo(
    () => nearby.filter((n) => (category ? n.quest.category === category : true)),
    [nearby, category],
  );
  const visible = filtered.slice(0, MAX_CARDS);

  const handleSelect = (quest: Quest) => {
    if (quest.isSideQuest) {
      setSelectedSideQuest(quest);
      selectQuest(null);
    } else {
      selectQuest(quest);
      setSelectedSideQuest(null);
    }
    setViewState({
      latitude: quest.lat,
      longitude: quest.lng,
      zoom: Math.max(viewState.zoom, 15),
    });
    setTopSheetOpen(false);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40 || info.velocity.y < -400) setTopSheetOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* tap-outside catcher */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTopSheetOpen(false)}
            className="fixed inset-0 -z-10 bg-slate-900/10 backdrop-blur-[2px] dark:bg-slate-950/25"
          />

          <motion.div
            // Unrolls downward out of the notch: origin at the top, so no gap
            // ever opens above the panel.
            initial={{ scaleY: 0.86, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0.86, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            style={{ transformOrigin: 'top center' }}
            drag="y"
            dragSnapToOrigin
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.35, bottom: 0 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="mx-auto mt-1 w-full max-w-3xl px-2"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/80 shadow-2xl shadow-slate-900/15 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85">
              {/* soft light falling in from the notch */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06]" />

              <div className="relative px-3 pt-3">
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    In deiner Nähe
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {filtered.length > visible.length
                      ? `${visible.length} von ${filtered.length}`
                      : `${visible.length} Quest${visible.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                <CategoryPills value={category} onChange={setCategory} />
              </div>

              <div className="no-scrollbar relative mt-2 grid max-h-[58vh] grid-cols-3 gap-2 overflow-y-auto px-3 pb-2">
                {visible.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center gap-1.5 py-10 text-center">
                    <Compass className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Nichts in der Nähe
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {category
                        ? 'Andere Kategorie probieren'
                        : 'Beweg dich — neue SideQuests spawnen laufend'}
                    </p>
                  </div>
                ) : (
                  visible.map((entry, i) => (
                    <QuestCard
                      key={entry.quest.id}
                      entry={entry}
                      featured={i === 0}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </div>

              {/* pull-up handle */}
              <button
                onClick={() => setTopSheetOpen(false)}
                className="group relative flex w-full cursor-grab justify-center py-2 active:cursor-grabbing"
                aria-label="Schließen"
              >
                <span className="h-1 w-10 rounded-full bg-slate-300 transition-all duration-200 group-hover:w-14 group-hover:bg-slate-400 dark:bg-slate-600 dark:group-hover:bg-slate-500" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
