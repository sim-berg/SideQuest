import { useState } from 'react';
import type { Quest } from '../../types/quest';
import { useChainStore } from '../../stores/useChainStore';
import { usePetStore, selectActivePet } from '../../stores/usePetStore';
import { useCelebrationStore } from '../../stores/useCelebrationStore';
import { useToastStore } from '../../stores/useToastStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useMapStore } from '../../stores/useMapStore';
import { completeChainStep } from '../../services/chain.service';
import { haversineDistance } from '../../services/distance.service';
import PetAvatar from '../pet/PetAvatar';
import { cn } from '../../utils/cn';

/**
 * Full-screen view of the running detective journey: solved stations with
 * their clues, the current clue, and GPS check-in at each station.
 */
export default function ChainSheet() {
  const chain = useChainStore((s) => s.chain);
  const sheetOpen = useChainStore((s) => s.sheetOpen);
  const closeSheet = useChainStore((s) => s.closeSheet);
  const setChain = useChainStore((s) => s.setChain);
  const pet = usePetStore((s) => selectActivePet(s));
  const upsertPet = usePetStore((s) => s.upsertPet);
  const fetchPets = usePetStore((s) => s.fetchPets);
  const celebrate = useCelebrationStore((s) => s.celebrate);
  const showToast = useToastStore((s) => s.showToast);
  const userLocation = useMapStore((s) => s.userLocation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!chain || !sheetOpen) return null;

  const current =
    chain.currentStep != null ? chain.steps[chain.currentStep] : null;
  const distanceM =
    current && current.lat != null && current.lng != null && userLocation
      ? Math.round(
          haversineDistance(
            userLocation.lat,
            userLocation.lng,
            current.lat,
            current.lng,
          ) * 1000,
        )
      : null;

  const checkIn = async () => {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
      const result = await completeChainStep(
        chain.id,
        current.index,
        pos.coords.latitude,
        pos.coords.longitude,
      );
      setChain(result.chain);
      if (result.xpResult) upsertPet(result.xpResult.pet);

      if (result.finished) {
        celebrate({
          type: 'complete',
          title: chain.title,
          xpResult: result.xpResult ?? undefined,
        });
        if (result.perk) {
          celebrate({
            type: 'achievement',
            title: `${result.perk.emoji} ${result.perk.name}`,
            description: result.perk.description,
          });
        }
        if (result.egg) {
          showToast('🥚 Ihr habt unterwegs ein neues mysteriöses Ei gefunden!');
          void fetchPets();
        }
      } else if (result.xpResult) {
        showToast(`🔍 Station gelöst! +${result.xpResult.xpAwarded} XP`);
      }
    } catch (e: any) {
      setError(e?.message || 'Bist du nah genug an der Station?');
    } finally {
      setBusy(false);
    }
  };

  /** Draw a walking route to the current station on the map. */
  const showRoute = () => {
    if (!current || current.lat == null || current.lng == null) return;
    const pseudoQuest = {
      id: `chain_${chain.id}_${current.index}`,
      title: current.title,
      description: current.clue ?? '',
      lat: current.lat,
      lng: current.lng,
      address: 'Geheime Station',
      category: 'mystery',
      questGiver: { name: pet?.name || 'Dein Gefährte' },
      difficulty: 'easy',
      acceptedBy: null,
      acceptedAt: null,
      completedBy: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
    } as Quest;
    closeSheet();
    void useRouteStore.getState().planRoute(pseudoQuest);
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-5 dark:border-slate-800">
        <button
          onClick={closeSheet}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Detektiv-Reise
          </p>
          <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">
            {chain.title}
          </h1>
        </div>
        {pet && <PetAvatar pet={pet} size={40} />}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5">
        {/* Steps */}
        <div className="flex flex-col gap-3">
          {chain.steps.map((step) => {
            const isCurrent = chain.currentStep === step.index;
            const revealed = step.clue != null;
            return (
              <div
                key={step.index}
                className={cn(
                  'rounded-2xl border p-4',
                  step.completed
                    ? 'border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                    : isCurrent
                    ? 'border-indigo-400 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                    : 'border-slate-100 dark:border-slate-800',
                )}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Station {step.index + 1}
                  {step.completed && ' ✓'}
                </p>
                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                  {revealed ? step.title : 'Noch verborgen …'}
                </p>
                {revealed && step.clue && (
                  <p className="mt-1.5 text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
                    „{step.clue}“
                  </p>
                )}
                {isCurrent && chain.status === 'active' && (
                  <div className="mt-3">
                    {distanceM != null && (
                      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                        📍 Noch etwa {distanceM} m entfernt
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={checkIn}
                        disabled={busy}
                        className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] active:bg-indigo-600"
                      >
                        {busy ? 'Prüfe Standort…' : '🔍 Ich bin hier!'}
                      </button>
                      <button
                        onClick={showRoute}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        🗺️ Route
                      </button>
                    </div>
                    {error && (
                      <p className="mt-2 text-xs text-red-500">{error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Conclusion */}
        {chain.status === 'completed' && chain.conclusion && (
          <div className="mt-5 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              🏁 Der Fall ist gelöst
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {chain.conclusion}
            </p>
            {chain.perk && (
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                {chain.perk.emoji} Neuer Perk: {chain.perk.name} —{' '}
                <span className="font-normal text-slate-600 dark:text-slate-300">
                  {chain.perk.description}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
