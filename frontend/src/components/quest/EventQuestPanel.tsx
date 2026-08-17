import { useCallback, useEffect, useState } from 'react';
import { Users, Timer, Coins, PartyPopper } from 'lucide-react';
import type { Quest, EventParticipation } from '../../types/quest';
import {
  joinEvent,
  eventCheckin,
  claimEventReward,
  fetchEventParticipation,
  finalizeEvent,
} from '../../services/quest.service';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { useCoinStore } from '../../stores/useCoinStore';
import { useToastStore } from '../../stores/useToastStore';
import { usePetStore } from '../../stores/usePetStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';

/** Presence heartbeat cadence while the detail screen is open. */
const CHECKIN_INTERVAL_MS = 60_000;

/**
 * Join / presence / claim flow for an event quest. While the panel is open
 * and the user has joined, it sends a GPS heartbeat every minute; presence
 * accrues server-side only when the heartbeat comes from inside the radius.
 */
export default function EventQuestPanel({ quest }: { quest: Quest }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const fetchWallet = useCoinStore((s) => s.fetchWallet);
  const showToast = useToastStore((s) => s.showToast);
  const upsertPet = usePetStore((s) => s.upsertPet);
  const celebrate = useCelebrationStore((s) => s.celebrate);

  const [participation, setParticipation] = useState<EventParticipation | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrganizer = userId != null && quest.createdBy === userId;

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchEventParticipation(quest.id)
      .then(setParticipation)
      .catch(() => {});
  }, [quest.id, isAuthenticated]);

  const sendHeartbeat = useCallback(async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
        }),
      );
      const updated = await eventCheckin(
        quest.id,
        pos.coords.latitude,
        pos.coords.longitude,
      );
      setParticipation(updated);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Check-in fehlgeschlagen');
    }
  }, [quest.id]);

  // Heartbeat loop while joined, not yet paid and the event is running.
  const shouldHeartbeat =
    !!participation?.joined && !participation.rewardPaid && !participation.ended;
  useEffect(() => {
    if (!shouldHeartbeat) return;
    void sendHeartbeat();
    const timer = setInterval(() => void sendHeartbeat(), CHECKIN_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [shouldHeartbeat, sendHeartbeat]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setParticipation(await joinEvent(quest.id));
      showToast('Du bist dabei! Bleib vor Ort, um die Belohnung zu verdienen.');
    } catch (e: any) {
      setError(e?.message || 'Beitritt fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await claimEventReward(quest.id);
      setParticipation(result.participation);
      if (result.xpResult) upsertPet(result.xpResult.pet);
      celebrate({
        type: 'complete',
        title: quest.title,
        xpResult: result.xpResult ?? undefined,
      });
      showToast(`+${result.coins} 🪙 verdient!`);
      void fetchWallet();
    } catch (e: any) {
      setError(e?.message || 'Abholen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    setBusy(true);
    setError(null);
    try {
      const { refunded } = await finalizeEvent(quest.id);
      showToast(
        refunded > 0
          ? `Event abgeschlossen — ${refunded} 🪙 zurückerstattet`
          : 'Event abgeschlossen',
      );
      void fetchWallet();
    } catch (e: any) {
      setError(e?.message || 'Abschliessen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const required = participation?.requiredMinutes ?? quest.requiredMinutes ?? 0;
  const minutes = participation?.presenceMinutes ?? 0;
  const progress = required > 0 ? Math.min(1, minutes / required) : 0;
  const ended = participation?.ended ?? isEnded(quest.eventEndsAt);

  return (
    <div className="mb-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
        <PartyPopper className="h-4 w-4" />
        Event-Quest
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1">
          <Coins className="h-3.5 w-3.5" />
          {quest.rewardPerParticipant} 🪙 pro Person
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {participation
            ? `${participation.participantCount}/${participation.maxParticipants}`
            : `max. ${quest.maxParticipants}`}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" />
          {required} min Anwesenheit
        </span>
        {quest.eventEndsAt && (
          <span>bis {formatEnd(quest.eventEndsAt)}</span>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isOrganizer ? (
        <div>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Du organisierst dieses Event. Nach dem Ende bekommst du nicht
            verdiente Coins zurück.
          </p>
          {ended && !quest.eventFinalized && (
            <button
              onClick={handleFinalize}
              disabled={busy}
              className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Event abschliessen & Rest zurückholen
            </button>
          )}
        </div>
      ) : !participation?.joined ? (
        <button
          onClick={handleJoin}
          disabled={busy || ended}
          className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {ended ? 'Event vorbei' : busy ? '...' : 'Mitmachen'}
        </button>
      ) : (
        <div>
          {/* presence progress */}
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {Math.floor(minutes)} / {required} min vor Ort
            </span>
            {participation.qualified && !participation.rewardPaid && (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Geschafft!
              </span>
            )}
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {participation.rewardPaid ? (
            <p className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ✅ Belohnung abgeholt
            </p>
          ) : participation.qualified ? (
            <button
              onClick={handleClaim}
              disabled={busy}
              className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? '...' : `${quest.rewardPerParticipant} 🪙 abholen`}
            </button>
          ) : (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {ended
                ? 'Das Event ist vorbei.'
                : 'Bleib in der Nähe — deine Anwesenheit wird automatisch gezählt.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function isEnded(endsAt: string | null): boolean {
  return !!endsAt && new Date(endsAt).getTime() < Date.now();
}

function formatEnd(endsAt: string): string {
  return new Date(endsAt).toLocaleString('de-DE', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
