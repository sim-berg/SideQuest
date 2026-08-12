import { useMemo, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import { ChevronDown, ChevronRight, MapPin, Zap, Sparkles, Clock, Compass } from 'lucide-react';
import { Category } from '../../types/quest';
import type { Quest } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { useUIStore } from '../../stores/useUIStore';
import { useMapStore } from '../../stores/useMapStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useNearbySideQuests, type NearbyQuest } from '../../hooks/useNearbySideQuests';
import { formatDistance, formatTimeRemaining } from '../../utils/format';
import { cn } from '../../utils/cn';

const ALL_CATEGORIES = Object.values(Category);
/** Keep the list glanceable — the sheet is a shortcut, not the logbook. */
const MAX_CARDS = 8;

// ─── Trigger: the wordmark doubles as the sheet handle ────────────────────────

/**
 * The "SideQuest" wordmark in the top bar. Tap toggles the sheet, a downward
 * drag pulls it open — same gesture language as a bottom sheet, mirrored.
 */
export function NextQuestsTrigger() {
  const open = useUIStore((s) => s.topSheetOpen);
  const toggleTopSheet = useUIStore((s) => s.toggleTopSheet);
  const setTopSheetOpen = useUIStore((s) => s.setTopSheetOpen);
  const count = useNearbySideQuests().length;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 24 || info.velocity.y > 400) setTopSheetOpen(true);
  };

  return (
    <motion.button
      onClick={toggleTopSheet}
      drag="y"
      dragSnapToOrigin
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.97 }}
      className="group flex cursor-grab flex-col items-center gap-1 rounded-2xl px-3 py-1 active:cursor-grabbing"
      aria-expanded={open}
      aria-label="Quests in der Nähe"
    >
      <span className="flex items-center gap-1.5">
        <span className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-lg font-black tracking-tight text-transparent drop-shadow-sm dark:from-white dark:to-slate-300">
          SideQuest
        </span>
        {count > 0 && (
          <span className="rounded-full bg-indigo-500/90 px-1.5 py-px text-[10px] font-bold text-white shadow-sm">
            {count}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-500 transition-transform duration-300 dark:text-slate-400',
            open && 'rotate-180',
          )}
        />
      </span>
      {/* grabber */}
      <span
        className={cn(
          'h-1 w-8 rounded-full bg-slate-400/50 transition-all duration-300 group-hover:w-10 group-hover:bg-slate-500/60 dark:bg-slate-500/50',
          open && 'w-10',
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
            : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700/80',
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
                : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700/80',
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
  const meta = CATEGORY_META[quest.category];
  const diff = DIFFICULTY_META[quest.difficulty ?? 'medium'];

  return (
    <button
      onClick={() => onSelect(quest)}
      className={cn(
        'group relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 active:scale-[0.99]',
        featured
          ? 'sq-shimmer border-amber-300/70 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-400/10'
          : 'border-slate-200/70 bg-white/60 hover:border-indigo-300/80 hover:bg-white dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:border-indigo-400/50 dark:hover:bg-slate-800',
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `${meta.color}22` }}
      >
        {meta.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {featured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/90 px-1.5 py-px text-[9px] font-black uppercase tracking-wide text-amber-950">
              <Sparkles className="h-2.5 w-2.5" /> Nächste
            </span>
          )}
          {quest.isSideQuest && !featured && (
            <span className="text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">
              SideQuest
            </span>
          )}
        </span>
        <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
          {quest.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          {distance !== null && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
              <MapPin className="h-2.5 w-2.5" /> {formatDistance(distance)}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
            <Zap className="h-2.5 w-2.5" /> {quest.reward ?? diff.xp} XP
          </span>
          {quest.expiresAt && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Clock className="h-2.5 w-2.5" /> {formatTimeRemaining(quest.expiresAt)}
            </span>
          )}
        </span>
      </span>

      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-slate-600" />
    </button>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

/**
 * Top sheet dropping out of the wordmark: a minimal category filter plus the
 * player's nearest quests as cards. Drag it up (or tap outside) to dismiss.
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

  const visible = useMemo(
    () =>
      nearby
        .filter((n) => (category ? n.quest.category === category : true))
        .slice(0, MAX_CARDS),
    [nearby, category],
  );

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
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            drag="y"
            dragSnapToOrigin
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.4, bottom: 0.05 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="mx-auto mt-1 w-full max-w-md px-3"
          >
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85">
              <div className="px-3 pt-3">
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    In deiner Nähe
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {visible.length} Quest{visible.length === 1 ? '' : 's'}
                  </span>
                </div>
                <CategoryPills value={category} onChange={setCategory} />
              </div>

              <div className="no-scrollbar mt-2 max-h-[52vh] space-y-2 overflow-y-auto px-3 pb-2">
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-8 text-center">
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
                className="group flex w-full cursor-grab justify-center py-2 active:cursor-grabbing"
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
