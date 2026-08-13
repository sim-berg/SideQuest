import { useCallback, useState } from 'react';
import type { Quest } from '../types/quest';
import { useQuestStore } from '../stores/useQuestStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { usePetStore, selectActivePet } from '../stores/usePetStore';
import { useCelebrationStore } from '../stores/useCelebrationStore';
import { useAchievementStore } from '../stores/useAchievementStore';
import { useToastStore } from '../stores/useToastStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useCoinStore } from '../stores/useCoinStore';
import { acceptQuest, completeQuest, abandonQuest } from '../services/quest.service';
import { shareQuest } from '../utils/share';

/**
 * Accept / complete / abandon / navigate / share logic for a regular quest,
 * mirroring useSideQuestActions but updating the quest store. Used by the
 * quest detail modal so quest markers get the same actions as side quests.
 */
export function useQuestActions(quest: Quest | null) {
  const updateQuestInList = useQuestStore((s) => s.updateQuestInList);
  const quests = useQuestStore((s) => s.quests);
  const setQuests = useQuestStore((s) => s.setQuests);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const showToast = useToastStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const upsertPet = usePetStore((s) => s.upsertPet);
  const celebrate = useCelebrationStore((s) => s.celebrate);
  const addAchievements = useAchievementStore((s) => s.addAchievements);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAcceptedByMe = !!quest && quest.acceptedBy === userId;

  const accept = useCallback(async () => {
    if (!quest) return;
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await acceptQuest(quest.id);
      updateQuestInList(updated);
      celebrate({ type: 'accept', title: updated.title });
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Annehmen');
    } finally {
      setLoading(false);
    }
  }, [quest, isAuthenticated, setShowAuthPrompt, updateQuestInList, celebrate]);

  const complete = useCallback(async () => {
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
      const prevStage = selectActivePet(usePetStore.getState())?.stage;
      const result = await completeQuest(quest.id, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      celebrate({
        type: 'complete',
        title: result.quest.title,
        xpResult: result.xpResult ?? undefined,
      });
      if (result.xpResult) {
        upsertPet(result.xpResult.pet);
        const newStage = result.xpResult.pet.stage;
        if (prevStage && newStage !== prevStage) {
          celebrate({ type: 'evolution', fromStage: prevStage, toStage: newStage });
        }
      }
      if (result.coinsAwarded) {
        useToastStore.getState().showToast(`+${result.coinsAwarded} 🪙`);
      }
      void useCoinStore.getState().fetchWallet();
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
      setQuests(quests.filter((q) => q.id !== result.quest.id));
      selectQuest(null);
    } catch (e: any) {
      setError(
        e?.message || 'Fehler beim Abschliessen. Bist du nah genug am Ziel?',
      );
    } finally {
      setLoading(false);
    }
  }, [quest, quests, setQuests, selectQuest, upsertPet, celebrate, addAchievements]);

  const abandon = useCallback(async () => {
    if (!quest) return;
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
  }, [quest, updateQuestInList]);

  /** Draw a walking route to the quest on the map, revealing it behind the detail screen. */
  const planRoute = useCallback(() => {
    if (!quest) return;
    selectQuest(null); // also closes the detail screen
    void useRouteStore.getState().planRoute(quest);
  }, [quest, selectQuest]);

  /** Jump straight into the Adventure-mode compass, routing in the background. */
  const openCompass = useCallback(() => {
    if (!quest) return;
    selectQuest(null);
    void useRouteStore.getState().planRoute(quest);
    useRouteStore.getState().openCompass(quest);
  }, [quest, selectQuest]);

  const share = useCallback(() => {
    if (!quest) return;
    void shareQuest(quest).then((copied) => {
      if (copied) showToast('Link kopiert');
    });
  }, [quest, showToast]);

  return {
    loading,
    error,
    isAcceptedByMe,
    accept,
    complete,
    abandon,
    planRoute,
    openCompass,
    share,
  };
}
