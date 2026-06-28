import { useCallback, useState } from 'react';
import type { Quest } from '../types/quest';
import { useSideQuestStore } from '../stores/useSideQuestStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { useDragonStore } from '../stores/useDragonStore';
import { useCelebrationStore } from '../stores/useCelebrationStore';
import { useAchievementStore } from '../stores/useAchievementStore';
import { useToastStore } from '../stores/useToastStore';
import { acceptQuest, completeQuest, abandonQuest } from '../services/quest.service';
import { toSlug } from '../utils/slug';

/**
 * Shared accept / complete / abandon / navigate / share logic for a side quest,
 * used by both the map card and the detail screen.
 */
export function useSideQuestActions(quest: Quest | null) {
  const updateSideQuestInList = useSideQuestStore((s) => s.updateSideQuestInList);
  const removeSideQuest = useSideQuestStore((s) => s.removeSideQuest);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const showToast = useToastStore((s) => s.showToast);
  const setDragon = useDragonStore((s) => s.setDragon);
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

  const navigate = useCallback(() => {
    if (!quest) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${quest.lat},${quest.lng}`,
      '_blank',
    );
  }, [quest]);

  const share = useCallback(() => {
    if (!quest) return;
    const url = `${window.location.origin}/quest/${toSlug(quest.title, quest.id)}`;
    // Mobile: native share sheet. Desktop browser: copy the link + toast.
    if (navigator.share) {
      void navigator
        .share({ title: quest.title, text: `SideQuest: ${quest.title}`, url })
        .catch(() => {});
    } else {
      void navigator.clipboard
        ?.writeText(url)
        .then(() => showToast('Link kopiert'))
        .catch(() => {});
    }
  }, [quest, showToast]);

  return {
    loading,
    error,
    isAcceptedByMe,
    isOpen,
    accept,
    complete,
    abandon,
    navigate,
    share,
  };
}
