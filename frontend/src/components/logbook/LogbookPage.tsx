import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  X,
  Zap,
  Trophy,
  CircleCheck,
  Sparkles,
  MapPin,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { useLogbookStore } from '../../stores/useLogbookStore';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { useDailySideQuestStore } from '../../stores/useDailySideQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDragonStore } from '../../stores/useDragonStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { completeDailySideQuest } from '../../services/sidequest.service';
import type { DailySideQuest } from '../../types/sidequest';

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-slate-50 py-4 dark:bg-slate-800/60">
      <Icon className="h-6 w-6" style={{ color }} />
      <span className="text-2xl font-black text-slate-900 dark:text-white">
        {value}
      </span>
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
      {children}
    </h3>
  );
}

function DailyRow({
  daily,
  onComplete,
  busy,
}: {
  daily: DailySideQuest;
  onComplete: (d: DailySideQuest) => void;
  busy: boolean;
}) {
  const meta = CATEGORY_META[daily.category];
  const diff = DIFFICULTY_META[daily.difficulty];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${meta.color}22` }}
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            daily.completed
              ? 'text-slate-400 line-through dark:text-slate-600'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {daily.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {diff.label} · {daily.xpReward} XP
        </p>
      </div>
      {daily.completed ? (
        <CircleCheck className="h-7 w-7 shrink-0 text-emerald-500" />
      ) : (
        <button
          onClick={() => onComplete(daily)}
          disabled={busy}
          className="shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow active:scale-95 disabled:opacity-50"
        >
          Erledigt
        </button>
      )}
    </div>
  );
}

export default function LogbookPage() {
  const open = useLogbookStore((s) => s.open);
  const close = useLogbookStore((s) => s.closeLogbook);

  const achievements = useAchievementStore((s) => s.achievements);
  const fetchAchievements = useAchievementStore((s) => s.fetchAchievements);
  const addAchievements = useAchievementStore((s) => s.addAchievements);

  const daily = useDailySideQuestStore((s) => s.daily);
  const fetchDaily = useDailySideQuestStore((s) => s.fetchDaily);
  const updateDaily = useDailySideQuestStore((s) => s.updateDaily);

  const sideQuests = useSideQuestStore((s) => s.sideQuests);
  const setSelected = useSideQuestStore((s) => s.setSelected);
  const userId = useAuthStore((s) => s.user?.id);
  const questsCompleted = useAuthStore((s) => s.user?.questsCompleted ?? 0);
  const dragonXp = useDragonStore((s) => s.dragon?.xp ?? 0);
  const setDragon = useDragonStore((s) => s.setDragon);
  const celebrate = useCelebrationStore((s) => s.celebrate);

  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void fetchAchievements();
      void fetchDaily();
    }
  }, [open, fetchAchievements, fetchDaily]);

  const activeSideQuests = sideQuests.filter(
    (q) => q.acceptedBy === userId && !q.completedBy,
  );

  const handleCompleteDaily = useCallback(
    async (d: DailySideQuest) => {
      setBusyId(d.id);
      try {
        const prevStage = useDragonStore.getState().dragon?.evolutionStage;
        const result = await completeDailySideQuest(d.id);
        updateDaily(result.daily);
        celebrate({
          type: 'complete',
          title: result.daily.title,
          xpResult: result.xpResult ?? undefined,
        });
        if (result.xpResult) {
          setDragon(result.xpResult.dragon);
          const newStage = result.xpResult.dragon.evolutionStage;
          if (prevStage && newStage !== prevStage) {
            celebrate({ type: 'evolution', fromStage: prevStage, toStage: newStage });
          }
        }
        if (result.achievements?.length) {
          addAchievements(result.achievements);
          for (const a of result.achievements) {
            celebrate({
              type: 'achievement',
              title: a.title,
              description: a.description,
              imageUrl: a.imageUrl,
            });
          }
        }
      } catch {
        // ignore — daily stays open
      } finally {
        setBusyId(null);
      }
    },
    [updateDaily, celebrate, setDragon, addAchievements],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white dark:bg-slate-900">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
          <BookOpen className="h-5 w-5" />
        </span>
        <h1 className="flex-1 text-lg font-bold text-slate-900 dark:text-white">
          Logbuch
        </h1>
        <button
          onClick={close}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10">
        {/* stats */}
        <div className="mt-4 flex gap-3">
          <StatCard icon={Zap} value={dragonXp} label="XP" color="#eab308" />
          <StatCard
            icon={Trophy}
            value={achievements.length}
            label="Errungenschaften"
            color="#f59e0b"
          />
          <StatCard
            icon={CircleCheck}
            value={questsCompleted}
            label="Quests"
            color="#22c55e"
          />
        </div>

        {/* daily side quests */}
        <SectionTitle>Heutige SideQuests</SectionTitle>
        <div className="flex flex-col gap-2">
          {daily.length === 0 && (
            <p className="text-sm text-slate-400">Keine täglichen SideQuests.</p>
          )}
          {daily.map((d) => (
            <DailyRow
              key={d.id}
              daily={d}
              onComplete={handleCompleteDaily}
              busy={busyId === d.id}
            />
          ))}
        </div>

        {/* active map side quests */}
        {activeSideQuests.length > 0 && (
          <>
            <SectionTitle>Aktive SideQuests</SectionTitle>
            <div className="flex flex-col gap-2">
              {activeSideQuests.map((q) => {
                const meta = CATEGORY_META[q.category];
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelected(q);
                      close();
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 text-left dark:border-slate-800"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${meta.color}22` }}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {q.title}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" /> Auf der Karte
                      </p>
                    </div>
                    <Sparkles className="h-5 w-5 shrink-0 text-amber-400" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* achievements gallery */}
        <SectionTitle>Errungenschaften</SectionTitle>
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-10 text-center dark:bg-slate-800/60">
            <Lock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">
              Schließe SideQuests ab, um Errungenschaften zu sammeln.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div
                key={a.key}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60"
              >
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt={a.title}
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl">
                    🏅
                  </div>
                )}
                <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  {a.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
