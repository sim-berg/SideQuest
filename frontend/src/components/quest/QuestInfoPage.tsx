import { useState, useCallback } from 'react';
import type { Quest } from '../../types/quest';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDragonStore } from '../../stores/useDragonStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { formatDistance, formatReward, formatTimeRemaining } from '../../utils/format';
import {
  acceptQuest,
  completeQuest,
  abandonQuest,
} from '../../services/quest.service';
import { cn } from '../../utils/cn';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

export function QuestInfoContent({ quest }: { quest: Quest }) {
  const distance = useQuestDistance(quest.lat, quest.lng);
  const meta = CATEGORY_META[quest.category];
  const diffMeta = DIFFICULTY_META[quest.difficulty ?? 'medium'];
  const created = new Date(quest.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const updateQuestInList = useQuestStore((s) => s.updateQuestInList);
  const updateSideQuestInList = useSideQuestStore((s) => s.updateSideQuestInList);
  const removeSideQuest = useSideQuestStore((s) => s.removeSideQuest);
  const setDragon = useDragonStore((s) => s.setDragon);
  const celebrate = useCelebrationStore((s) => s.celebrate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncQuest = useCallback(
    (q: Quest) => {
      updateQuestInList(q);
      if (q.isSideQuest) updateSideQuestInList(q);
    },
    [updateQuestInList, updateSideQuestInList],
  );

  const isAcceptedByMe = quest.acceptedBy === userId;
  const isAcceptedByOther = quest.acceptedBy && quest.acceptedBy !== userId;
  const isCompleted = !!quest.completedBy;

  const handleAccept = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await acceptQuest(quest.id);
      syncQuest(updated);
      celebrate({ type: 'accept', title: updated.title });
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Annehmen');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, quest.id, setShowAuthPrompt, syncQuest, celebrate]);

  const handleComplete = useCallback(async () => {
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
      syncQuest(result.quest);
      // Side quests vanish from the map once completed.
      if (result.quest.isSideQuest) removeSideQuest(result.quest.id);

      celebrate({ type: 'complete', title: result.quest.title, xpResult: result.xpResult ?? undefined });

      if (result.xpResult) {
        setDragon(result.xpResult.dragon);
        const newStage = result.xpResult.dragon.evolutionStage;
        if (prevStage && newStage !== prevStage) {
          celebrate({ type: 'evolution', fromStage: prevStage, toStage: newStage });
        }
      }
    } catch (e: any) {
      const msg =
        e?.message || 'Fehler beim Abschliessen. Bist du nah genug am Ziel?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [quest.id, syncQuest, removeSideQuest, setDragon, celebrate]);

  const handleAbandon = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await abandonQuest(quest.id);
      syncQuest(updated);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Aufgeben');
    } finally {
      setLoading(false);
    }
  }, [quest.id, syncQuest]);

  return (
    <div className="flex flex-col gap-0 px-5 pb-10">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: meta.color }}
          >
            <span>{meta.icon}</span>
            {meta.label}
          </div>
          <div
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: diffMeta.color }}
          >
            {diffMeta.label}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {quest.title}
        </h1>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {quest.description}
      </p>

      {/* Info Section */}
      <div className="mb-6 divide-y divide-slate-100 rounded-xl bg-slate-50 px-4 dark:divide-slate-700/50 dark:bg-slate-800/50">
        <InfoRow
          icon="👤"
          label="Quest Geber"
          value={quest.questGiver.name}
        />
        <InfoRow icon="📍" label="Adresse" value={quest.address} />
        {quest.reward != null && (
          <InfoRow
            icon="🏆"
            label="Belohnung"
            value={formatReward(quest.reward)}
          />
        )}
        {quest.timeLimit && (
          <InfoRow
            icon="⏰"
            label="Zeitlimit"
            value={formatTimeRemaining(quest.timeLimit)}
          />
        )}
        {distance !== null && (
          <InfoRow
            icon="🗺️"
            label="Entfernung"
            value={formatDistance(distance)}
          />
        )}
        <InfoRow icon="📅" label="Erstellt am" value={created} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isCompleted ? (
          <button
            disabled
            className="w-full rounded-xl bg-emerald-100 py-3.5 text-base font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            ✓ Quest abgeschlossen
          </button>
        ) : isAcceptedByMe ? (
          <>
            <button
              onClick={handleComplete}
              disabled={loading}
              className={cn(
                'w-full rounded-xl py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                loading
                  ? 'cursor-not-allowed bg-emerald-400'
                  : 'bg-emerald-500 active:bg-emerald-600',
              )}
            >
              {loading ? 'Prüfe Standort...' : 'Quest abschliessen'}
            </button>
            <button
              onClick={handleAbandon}
              disabled={loading}
              className="w-full rounded-xl border-2 border-red-200 py-3.5 text-base font-bold text-red-500 transition-all active:scale-[0.98] active:bg-red-50 dark:border-red-900 dark:active:bg-red-950/30"
            >
              Quest aufgeben
            </button>
          </>
        ) : isAcceptedByOther ? (
          <button
            disabled
            className="w-full rounded-xl bg-slate-100 py-3.5 text-base font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500"
          >
            Quest bereits vergeben
          </button>
        ) : (
          <button
            onClick={handleAccept}
            disabled={loading}
            className={cn(
              'w-full rounded-xl py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]',
              loading
                ? 'cursor-not-allowed bg-indigo-400'
                : 'bg-indigo-500 active:bg-indigo-600',
            )}
          >
            {loading ? 'Wird angenommen...' : 'Quest annehmen'}
          </button>
        )}

        {!isCompleted && !isAcceptedByMe && (
          <button
            onClick={() => {
              useUIStore.getState().setActiveTab('chat');
            }}
            className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-base font-bold text-slate-700 transition-all active:scale-[0.98] active:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:active:bg-slate-700"
          >
            Nachricht an {quest.questGiver.name}
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuestInfoPage() {
  const infoPageOpen = useUIStore((s) => s.infoPageOpen);
  const closeInfoPage = useUIStore((s) => s.closeInfoPage);
  const selectedQuest = useQuestStore((s) => s.selectedQuest);
  const selectQuest = useQuestStore((s) => s.selectQuest);

  if (!infoPageOpen || !selectedQuest) return null;

  const handleClose = () => {
    closeInfoPage();
    selectQuest(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurueck"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Quest Details
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <QuestInfoContent quest={selectedQuest} />
      </div>
    </div>
  );
}
