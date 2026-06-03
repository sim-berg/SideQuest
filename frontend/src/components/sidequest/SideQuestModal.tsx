import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Navigation,
  Swords,
  CircleCheck,
  Share2,
  X,
  Flag,
  MapPin,
  Coins,
  Zap,
  Clock,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { useDragonStore } from '../../stores/useDragonStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';
import { useAchievementStore } from '../../stores/useAchievementStore';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { formatDistance } from '../../utils/format';
import { acceptQuest, completeQuest, abandonQuest } from '../../services/quest.service';

function RoundActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger';
}) {
  const styles: Record<string, string> = {
    default:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    primary: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
    danger: 'bg-red-50 text-red-500 dark:bg-red-950/40',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-16 shrink-0 flex-col items-center gap-1.5 disabled:opacity-50"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-90 ${styles[variant]}`}
      >
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </button>
  );
}

function InfoChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {text}
      </span>
    </div>
  );
}

function minutesLeft(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Abgelaufen';
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

export default function SideQuestModal() {
  const quest = useSideQuestStore((s) => s.selected);
  const setSelected = useSideQuestStore((s) => s.setSelected);
  const updateSideQuestInList = useSideQuestStore((s) => s.updateSideQuestInList);
  const removeSideQuest = useSideQuestStore((s) => s.removeSideQuest);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const setDragon = useDragonStore((s) => s.setDragon);
  const celebrate = useCelebrationStore((s) => s.celebrate);
  const addAchievements = useAchievementStore((s) => s.addAchievements);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const distance = useQuestDistance(quest?.lat ?? 0, quest?.lng ?? 0);

  const close = useCallback(() => {
    setSelected(null);
    setError(null);
  }, [setSelected]);

  const handleAccept = useCallback(async () => {
    if (!quest) return;
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await acceptQuest(quest.id);
      updateSideQuestInList(updated);
      celebrate({ type: 'accept', title: updated.title });
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Annehmen');
    } finally {
      setLoading(false);
    }
  }, [quest, isAuthenticated, setShowAuthPrompt, updateSideQuestInList, celebrate]);

  const handleComplete = useCallback(async () => {
    if (!quest) return;
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
      const prevStage = useDragonStore.getState().dragon?.evolutionStage;
      const result = await completeQuest(
        quest.id,
        pos.coords.latitude,
        pos.coords.longitude,
      );
      celebrate({
        type: 'complete',
        title: result.quest.title,
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
      removeSideQuest(result.quest.id);
    } catch (e: any) {
      setError(
        e?.message || 'Fehler beim Abschliessen. Bist du nah genug am Ziel?',
      );
    } finally {
      setLoading(false);
    }
  }, [quest, setDragon, celebrate, addAchievements, removeSideQuest]);

  const handleAbandon = useCallback(async () => {
    if (!quest) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await abandonQuest(quest.id);
      updateSideQuestInList(updated);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Aufgeben');
    } finally {
      setLoading(false);
    }
  }, [quest, updateSideQuestInList]);

  const handleNavigate = useCallback(() => {
    if (!quest) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`,
      '_blank',
    );
  }, [quest]);

  const handleShare = useCallback(() => {
    if (!quest) return;
    const text = `SideQuest: ${quest.title} – ${quest.description}`;
    if (navigator.share) {
      void navigator.share({ title: quest.title, text }).catch(() => {});
    } else {
      void navigator.clipboard?.writeText(text).catch(() => {});
    }
  }, [quest]);

  const meta = quest ? CATEGORY_META[quest.category] : null;
  const diff = quest ? DIFFICULTY_META[quest.difficulty ?? 'medium'] : null;
  const isAcceptedByMe = quest?.acceptedBy === userId;
  const expiry = minutesLeft(quest?.expiresAt);

  return (
    <AnimatePresence>
      {quest && meta && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* light scrim, Google-Maps style (map stays visible) */}
          <div className="absolute inset-0 bg-black/30" onClick={close} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="relative w-full max-w-md rounded-t-3xl bg-white px-5 pb-8 pt-3 shadow-2xl dark:bg-slate-900"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />

            {/* header */}
            <div className="mb-3 flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${meta.color}22` }}
              >
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <Sparkles className="h-3 w-3" /> SideQuest
                </span>
                <h2 className="mt-0.5 truncate text-lg font-bold text-slate-900 dark:text-white">
                  {quest.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quest.questGiver.name}
                </p>
              </div>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Schliessen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {quest.description}
            </p>

            {/* info chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {distance !== null && (
                <InfoChip icon={MapPin} text={formatDistance(distance)} />
              )}
              {diff && <InfoChip icon={Zap} text={`${diff.label} · ${diff.xp} XP`} />}
              {quest.reward != null && quest.reward > 0 && (
                <InfoChip icon={Coins} text={`${quest.reward}`} />
              )}
              {expiry && <InfoChip icon={Clock} text={expiry} />}
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* round action buttons (Google-Maps style) */}
            <div className="flex items-start justify-around gap-2">
              <RoundActionButton
                icon={Navigation}
                label="Route"
                onClick={handleNavigate}
              />
              {isAcceptedByMe ? (
                <>
                  <RoundActionButton
                    icon={CircleCheck}
                    label={loading ? '...' : 'Abschliessen'}
                    onClick={handleComplete}
                    disabled={loading}
                    variant="success"
                  />
                  <RoundActionButton
                    icon={Flag}
                    label="Aufgeben"
                    onClick={handleAbandon}
                    disabled={loading}
                    variant="danger"
                  />
                </>
              ) : (
                <RoundActionButton
                  icon={Swords}
                  label={loading ? '...' : 'Annehmen'}
                  onClick={handleAccept}
                  disabled={loading || !!quest.acceptedBy}
                  variant="primary"
                />
              )}
              <RoundActionButton
                icon={Share2}
                label="Teilen"
                onClick={handleShare}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
