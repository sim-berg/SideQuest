import { useCallback, useEffect, useState } from 'react';
import {
  CircleCheck,
  Sparkles,
  MapPin,
  Lock,
  MessageSquare,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLogbookStore } from '../../stores/useLogbookStore';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { useDailySideQuestStore } from '../../stores/useDailySideQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { useUIStore } from '../../stores/useUIStore';
import { useDragonStore } from '../../stores/useDragonStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';
import { useDistanceStore } from '../../stores/useDistanceStore';
import { useToastStore } from '../../stores/useToastStore';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { completeDailySideQuest } from '../../services/sidequest.service';
import { fetchMyActiveQuests } from '../../services/quest.service';
import { fetchMyComments } from '../../services/user.service';
import type { Quest } from '../../types/quest';
import type { DailyBoard, DailySideQuest } from '../../types/sidequest';
import type { Comment } from '../../types/comment';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  emoji,
  color,
}: {
  value: string | number;
  label: string;
  emoji: string;
  color: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-slate-50 py-3 dark:bg-slate-800/60">
      <span className="text-xl">{emoji}</span>
      <span className="text-lg font-black" style={{ color }}>{value}</span>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight px-1">
        {label}
      </span>
    </div>
  );
}

// ─── Streak + stats block ─────────────────────────────────────────────────────

function StreakStatsBlock({
  streak,
  xp,
  achievements,
  questsCompleted,
  kmToday,
  longestStreak,
}: {
  streak: number;
  xp: number;
  achievements: number;
  questsCompleted: number;
  kmToday: number;
  longestStreak: number;
}) {
  const flames = Math.min(streak, 7);
  const kmDisplay = kmToday >= 1 ? `${kmToday.toFixed(1)}` : `${Math.round(kmToday * 1000)}m`;
  const kmLabel = kmToday >= 1 ? 'km heute' : 'm heute';

  return (
    <div className="mt-4 space-y-3">
      {/* Streak banner */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)' }}
        >
          {/* Flames row */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: flames }).map((_, i) => (
              <motion.span
                key={i}
                className="text-base"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.05 + i * 0.05, type: 'spring', stiffness: 400 }}
              >
                🔥
              </motion.span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">
              {streak} {streak === 1 ? 'Tag' : 'Tage'} Streak
            </p>
            <p className="text-[11px] text-orange-200/70">
              {streak >= 30
                ? 'Legende! Unaufhaltsam 🏆'
                : streak >= 7
                ? 'Eine ganze Woche – weiter so!'
                : 'Komm morgen wieder!'}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-black text-white">
            {streak}
          </div>
        </motion.div>
      )}

      {/* 4 stat cards */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard value={xp} label="XP" emoji="⚡" color="#eab308" />
        <StatCard value={achievements} label="Badges" emoji="🏅" color="#f59e0b" />
        <StatCard value={questsCompleted} label="Quests" emoji="⚔️" color="#22c55e" />
        <StatCard
          value={longestStreak > streak ? longestStreak : kmDisplay}
          label={longestStreak > streak ? 'Rekord-Streak' : kmLabel}
          emoji={longestStreak > streak ? '🏔️' : '🗺️'}
          color="#3b82f6"
        />
      </div>
    </div>
  );
}

// ─── Daily board header ───────────────────────────────────────────────────────

/** Three dots: filled = done. Makes "3 per day" readable at a glance. */
function BoardProgress({ board }: { board: DailyBoard }) {
  return (
    <div className="flex items-center gap-1.5">
      {board.quests.map((q) => (
        <motion.span
          key={q.id}
          layout
          className={`h-2.5 w-2.5 rounded-full ${
            q.completed ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

function DailyBoardHeader({ board }: { board: DailyBoard }) {
  const open = board.total - board.completed;

  return (
    <div
      className={`mt-6 flex items-center gap-3 rounded-2xl border p-3.5 ${
        board.allDone
          ? 'border-emerald-400/60 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10'
          : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      <span className="text-2xl">{board.allDone ? '🔥' : '📜'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900 dark:text-white">
          Tagesquests
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {board.total === 0
            ? 'Heute keine Aufgaben.'
            : board.allDone
            ? `Tag gesichert — Streak: ${board.streak} ${board.streak === 1 ? 'Tag' : 'Tage'}`
            : `Noch ${open} ${open === 1 ? 'Aufgabe' : 'Aufgaben'} bis der Tag gesichert ist`}
        </p>
      </div>
      <BoardProgress board={board} />
      <span className="shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500">
        {board.completed}/{board.total}
      </span>
    </div>
  );
}

// ─── Daily quest row ──────────────────────────────────────────────────────────

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
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-2xl border p-3 ${
        daily.completed
          ? 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30'
          : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${meta.color}22` }}
      >
        {daily.emoji || meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            daily.completed
              ? 'text-slate-400 line-through dark:text-slate-600'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {daily.title}
        </p>
        {!daily.completed && (
          <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
            {daily.description}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
          <span style={{ color: diff.color }}>{diff.label}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            {daily.xpReward} XP
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span style={{ color: meta.color }}>{meta.label}</span>
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
    </motion.div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-baseline justify-between">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {children}
      </h3>
      {right}
    </div>
  );
}

// ─── Comment card ─────────────────────────────────────────────────────────────

function CommentCard({ comment }: { comment: Comment }) {
  const when = new Date(comment.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
      {comment.avatarUrl ? (
        <img
          src={comment.avatarUrl}
          alt={comment.username}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base dark:bg-indigo-900/40">
          🧙
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {comment.username || 'Du'}
          </span>
          <span className="text-[10px] text-slate-400">{when}</span>
        </div>
        {comment.body && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            {comment.body}
          </p>
        )}
        {comment.imageUrl && (
          <img
            src={comment.imageUrl}
            alt="Kommentar-Bild"
            className="mt-2 max-h-28 w-auto rounded-xl object-cover"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LogbookPage() {
  const open = useLogbookStore((s) => s.open);
  const close = useLogbookStore((s) => s.closeLogbook);

  const achievements = useAchievementStore((s) => s.achievements);
  const fetchAchievements = useAchievementStore((s) => s.fetchAchievements);
  const addAchievements = useAchievementStore((s) => s.addAchievements);

  const board = useDailySideQuestStore((s) => s.board);
  const fetchDaily = useDailySideQuestStore((s) => s.fetchDaily);
  const updateDaily = useDailySideQuestStore((s) => s.updateDaily);
  const setBoard = useDailySideQuestStore((s) => s.setBoard);

  const setSelected = useSideQuestStore((s) => s.setSelected);
  const openDetail = useSideQuestStore((s) => s.openDetail);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const openQuestDetail = useQuestStore((s) => s.openDetail);

  const questsCompleted = useAuthStore((s) => s.user?.questsCompleted ?? 0);
  const avatarUrl = useAuthStore((s) => s.user?.avatarUrl);
  const dragonXp = useDragonStore((s) => s.dragon?.xp ?? 0);
  const setDragon = useDragonStore((s) => s.setDragon);
  const celebrate = useCelebrationStore((s) => s.celebrate);

  const totalUnread = useChatStore((s) => s.totalUnread);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const showToast = useToastStore((s) => s.showToast);
  const kmToday = useDistanceStore((s) => s.kmToday);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);

  useEffect(() => {
    if (!open) return;
    void fetchAchievements();
    void fetchDaily();
    fetchMyComments()
      .then(setMyComments)
      .catch(() => {});
    fetchMyActiveQuests()
      .then(setActiveQuests)
      .catch(() => {});
  }, [open, fetchAchievements, fetchDaily]);

  // Open the right detail view for a quest, depending on its type.
  const openQuest = useCallback(
    (q: Quest) => {
      close();
      if (q.isSideQuest) {
        setSelected(q);
        openDetail();
      } else {
        selectQuest(q);
        openQuestDetail();
      }
    },
    [close, setSelected, openDetail, selectQuest, openQuestDetail],
  );

  /** Jump from the logbook to another tab (profile / chat). */
  const goToTab = useCallback(
    (tab: 'profile' | 'chat') => {
      close();
      setActiveTab(tab);
    },
    [close, setActiveTab],
  );

  const handleCompleteDaily = useCallback(
    async (d: DailySideQuest) => {
      setBusyId(d.id);
      try {
        const prevStage = useDragonStore.getState().dragon?.evolutionStage;
        const result = await completeDailySideQuest(d.id);
        updateDaily(result.daily);
        setBoard(result.board);
        celebrate({ type: 'complete', title: result.daily.title, xpResult: result.xpResult ?? undefined });
        if (result.bonusXp > 0) {
          showToast(
            `🔥 Tag gesichert! ${result.board.streak} ${result.board.streak === 1 ? 'Tag' : 'Tage'} Streak (+${result.bonusXp} XP)`,
          );
        }
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
            celebrate({ type: 'achievement', title: a.title, description: a.description, imageUrl: a.imageUrl });
          }
        }
      } catch {
        // ignore
      } finally {
        setBusyId(null);
      }
    },
    [updateDaily, setBoard, celebrate, setDragon, addAchievements, showToast],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar — back, title, chat + profile shortcuts */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={close}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurück"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Logbuch</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => goToTab('chat')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Chat öffnen"
          >
            <MessageSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => goToTab('profile')}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Profil öffnen"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10">

        {/* Streak banner + 4 stat cards */}
        <StreakStatsBlock
          streak={board.streak}
          longestStreak={board.longestStreak}
          xp={dragonXp}
          achievements={achievements.length}
          questsCompleted={questsCompleted}
          kmToday={kmToday}
        />

        {/* Today's three daily quests — clearing all three secures the day */}
        <DailyBoardHeader board={board} />

        <AnimatePresence mode="popLayout">
          <div className="mt-2 flex flex-col gap-2">
            {board.quests.length === 0 && (
              <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-400">
                Keine Tagesquests — schau später nochmal rein.
              </motion.p>
            )}
            {board.quests.map((d) => (
              <DailyRow key={d.id} daily={d} onComplete={handleCompleteDaily} busy={busyId === d.id} />
            ))}
          </div>
        </AnimatePresence>

        {/* My accepted, not-yet-completed quests (side + regular) */}
        {activeQuests.length > 0 && (
          <>
            <SectionTitle
              right={<span className="text-xs text-slate-400">{activeQuests.length}</span>}
            >
              Meine aktiven Quests
            </SectionTitle>
            <div className="flex flex-col gap-2">
              {activeQuests.map((q) => {
                const meta = CATEGORY_META[q.category];
                return (
                  <button
                    key={q.id}
                    onClick={() => openQuest(q)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 text-left dark:border-slate-800"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${meta.color}22` }}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{q.title}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" /> {q.address || 'Auf der Karte'}
                      </p>
                    </div>
                    {q.isSideQuest ? (
                      <Sparkles className="h-5 w-5 shrink-0 text-amber-400" />
                    ) : (
                      <CircleCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Recent comments */}
        <SectionTitle
          right={
            myComments.length > 0
              ? <span className="text-xs text-slate-400">{myComments.length}</span>
              : undefined
          }
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Letzte Kommentare
          </span>
        </SectionTitle>
        {myComments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-8 text-center dark:bg-slate-800/60">
            <MessageSquare className="h-7 w-7 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">Noch keine Kommentare geschrieben.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {myComments.map((c) => <CommentCard key={c.id} comment={c} />)}
          </div>
        )}

        {/* Achievements gallery */}
        <SectionTitle>Errungenschaften</SectionTitle>
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-10 text-center dark:bg-slate-800/60">
            <Lock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">Schließe SideQuests ab, um Errungenschaften zu sammeln.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div key={a.key} className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                {a.imageUrl
                  ? <img src={a.imageUrl} alt={a.title} className="h-16 w-16 object-contain" />
                  : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl">🏅</div>
                }
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
