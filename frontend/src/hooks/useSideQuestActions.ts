import { useCallback, useState } from 'react';
import type { Quest } from '../types/quest';
import { useSideQuestStore } from '../stores/useSideQuestStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { usePetStore, selectActivePet } from '../stores/usePetStore';
import { useCelebrationStore } from '../stores/useCelebrationStore';
import { useAchievementStore } from '../stores/useAchievementStore';
import { useToastStore } from '../stores/useToastStore';
import { useRouteStore } from '../stores/useRouteStore';
import { acceptQuest, completeQuest, abandonQuest } from '../services/quest.service';
import { shareQuest } from '../utils/share';

/**
 * Shared accept / complete / abandon / navigate / share logic for a side quest,
 * used by both the map card and the detail screen.
 */
export function useSideQuestActions(quest: Quest | null) {
  const updateSideQuestInList = useSideQuestStore((s) => s.updateSideQuestInList);
  const removeSideQuest = useSideQuestStore((s) => s.removeSideQuest);
  const setSelected = useSideQuestStore((s) => s.setSelected);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const showToast = useToastStore((s) => s.showToast);
  const upsertPet = usePetStore((s) => s.upsertPet);
  const celebrate = useCelebrationStore((s) => s.celebrate);
  const addAchievements = useAchievementStore((s) => s.addAchievements);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAcceptedByMe = !!quest && quest.acceptedBy === userId;
  const isOpen = !!quest && !quest.acceptedBy && !quest.completedBy;

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
      updateSideQuestInList(updated);
      celebrate({ type: 'accept', title: updated.title });
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Annehmen');
    } finally {
      setLoading(false);
    }
  }, [quest, isAuthenticated, setShowAuthPrompt, updateSideQuestInList, celebrate]);

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
  }, [quest, upsertPet, celebrate, addAchievements, removeSideQuest]);

  const abandon = useCallback(async () => {
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

  /** Draw a walking route to the quest on the map, revealing it behind the detail screen. */
  const planRoute = useCallback(() => {
    if (!quest) return;
    setSelected(null); // also closes the detail screen
    void useRouteStore.getState().planRoute(quest);
  }, [quest, setSelected]);

  /** Jump straight into the Adventure-mode compass, routing in the background. */
  const openCompass = useCallback(() => {
    if (!quest) return;
    setSelected(null);
    void useRouteStore.getState().planRoute(quest);
    useRouteStore.getState().openCompass(quest);
  }, [quest, setSelected]);

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
    isOpen,
    accept,
    complete,
    abandon,
    planRoute,
    openCompass,
    share,
  };
}
