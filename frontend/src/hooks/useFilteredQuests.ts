import { useMemo } from 'react';
import { useQuestStore } from '../stores/useQuestStore';
import { useFilterStore } from '../stores/useFilterStore';
import { useMapStore } from '../stores/useMapStore';
import { haversineDistance } from '../services/distance.service';

export function useFilteredQuests() {
  const quests = useQuestStore((s) => s.quests);
  const categories = useFilterStore((s) => s.categories);
  const distanceKm = useFilterStore((s) => s.distanceKm);
  const paidOnly = useFilterStore((s) => s.paidOnly);
  const timedOnly = useFilterStore((s) => s.timedOnly);
  const userLocation = useMapStore((s) => s.userLocation);

  return useMemo(() => {
    return quests.filter((q) => {
      if (!categories.includes(q.category)) return false;
      if (paidOnly && !q.reward) return false;
      if (timedOnly && !q.timeLimit) return false;
      if (userLocation) {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          q.lat,
          q.lng,
        );
        if (dist > distanceKm) return false;
      }
      return true;
    });
  }, [quests, categories, distanceKm, paidOnly, timedOnly, userLocation]);
}
