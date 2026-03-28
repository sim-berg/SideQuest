import { useState, useCallback, useEffect } from 'react';
import type { Quest } from '../../types/quest';
import type { XpResult } from '../../types/dragon';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDragonStore } from '../../stores/useDragonStore';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { formatDistance, formatReward, formatTimeRemaining } from '../../utils/format';
import {
  acceptQuest,
  completeQuest,
  abandonQuest,
} from '../../services/quest.service';
import XpToast from '../dragon/XpToast';
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

function QuestInfoContent({ quest }: { quest: Quest }) {
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
  const setDragon = useDragonStore((s) => s.setDragon);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpResult, setXpResult] = useState<XpResult | null>(null);
  const [countInput, setCountInput] = useState('');
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const isAcceptedByMe = quest.acceptedBy === userId;
  const isAcceptedByOther = quest.acceptedBy && quest.acceptedBy !== userId;
  const isCompleted = !!quest.completedBy;

  const handleAccept = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await acceptQuest(quest.id);
      updateQuestInList(updated);
      setShowAcceptConfirm(false);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Annehmen');
    } finally {
      setLoading(false);
    }
  }, [quest.id, updateQuestInList]);

  // Timer for quest timeLimit
  useEffect(() => {
    if (!isAcceptedByMe || !quest.timeLimit) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(quest.timeLimit!).getTime();
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeLeft('Zeit abgelaufen');
        return;
      }

      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isAcceptedByMe, quest.timeLimit]);

  const handleCompleteProximity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
      const result = await completeQuest(quest.id, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      updateQuestInList(result.quest);
      if (result.xpResult) {
        setXpResult(result.xpResult);
        setDragon(result.xpResult.dragon);
      }
    } catch (e: any) {
      const msg =
        e?.message || 'Fehler beim Abschliessen. Bist du nah genug am Ziel?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [quest.id, updateQuestInList, setDragon]);

  const handleCompleteManual = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await completeQuest(quest.id, {});
      updateQuestInList(result.quest);
      if (result.xpResult) {
        setXpResult(result.xpResult);
        setDragon(result.xpResult.dragon);
      }
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Abschliessen');
    } finally {
      setLoading(false);
    }
  }, [quest.id, updateQuestInList, setDragon]);

  const handleCompleteCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await completeQuest(quest.id, {
        countCompleted: parseInt(countInput, 10),
      });
      updateQuestInList(result.quest);
      if (result.xpResult) {
        setXpResult(result.xpResult);
        setDragon(result.xpResult.dragon);
      }
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Abschliessen');
    } finally {
      setLoading(false);
    }
  }, [quest.id, countInput, updateQuestInList, setDragon]);

  const handleAbandon = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await abandonQuest(quest.id);
      updateQuestInList(updated);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Aufgeben');
    } finally {
      setLoading(false);
    }
  }, [quest.id, updateQuestInList]);

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

      {/* Timer Banner */}
      {isAcceptedByMe && timeLeft && (
        <div
          className={cn(
            'mb-4 rounded-lg px-4 py-3 text-center font-bold transition-colors',
            timeLeft === 'Zeit abgelaufen'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : parseInt(timeLeft.split(':')[0]) < 5
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse'
                : parseInt(timeLeft.split(':')[0]) < 30
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
          )}
        >
          ⏱ Noch {timeLeft}
        </div>
      )}

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
            {/* Proximity quest (existing behavior) */}
            {(quest.goalType ?? 'proximity') === 'proximity' && (
              <button
                onClick={handleCompleteProximity}
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
            )}

            {/* Manual quest */}
            {quest.goalType === 'manual' && (
              <button
                onClick={handleCompleteManual}
                disabled={loading}
                className={cn(
                  'w-full rounded-xl py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                  loading
                    ? 'cursor-not-allowed bg-emerald-400'
                    : 'bg-emerald-500 active:bg-emerald-600',
                )}
              >
                {loading ? 'Wird gespeichert...' : "Ich hab's geschafft! ✓"}
              </button>
            )}

            {/* Count-based quest */}
            {quest.goalType === 'count' && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Ziel: {quest.goalCount} Wiederholungen
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={quest.goalCount ?? undefined}
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    placeholder={`0 von ${quest.goalCount}`}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="text-sm text-slate-400">von {quest.goalCount}</span>
                </div>
                <button
                  onClick={handleCompleteCount}
                  disabled={loading || !countInput || parseInt(countInput, 10) < 1}
                  className={cn(
                    'w-full rounded-xl py-3.5 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                    loading || !countInput || parseInt(countInput, 10) < 1
                      ? 'cursor-not-allowed bg-emerald-400'
                      : 'bg-emerald-500 active:bg-emerald-600',
                  )}
                >
                  {loading ? 'Wird gespeichert...' : 'Abschliessen'}
                </button>
              </div>
            )}

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
          <>
            {!showAcceptConfirm ? (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowAuthPrompt(true);
                    return;
                  }
                  setShowAcceptConfirm(true);
                }}
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
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Möchtest du diese Quest annehmen?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={loading}
                    className={cn(
                      'flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]',
                      loading
                        ? 'cursor-not-allowed bg-emerald-400'
                        : 'bg-emerald-500 active:bg-emerald-600',
                    )}
                  >
                    {loading ? 'Wird angenommen...' : 'Ja, Quest annehmen!'}
                  </button>
                  <button
                    onClick={() => setShowAcceptConfirm(false)}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-700 transition-all active:scale-[0.98] dark:bg-slate-700 dark:text-slate-300"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </>
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

      {/* XP Toast */}
      {xpResult && (
        <XpToast xpResult={xpResult} onDone={() => setXpResult(null)} />
      )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-[1200px] h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-2">
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
    </div>
  );
}
