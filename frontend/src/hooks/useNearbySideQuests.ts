import { useEffect, useMemo, useState } from 'react';
import { useSideQuestStore } from '../stores/useSideQuestStore';
import { useQuestStore } from '../stores/useQuestStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useMapStore } from '../stores/useMapStore';
import { haversineDistance } from '../services/distance.service';
import type { Quest } from '../types/quest';

export interface NearbyQuest {
  quest: Quest;
  /** km from the player, or null while the GPS fix is missing. */
  distance: number | null;
}

/**
 * The quests worth walking to right now: spawned side quests plus the regular
 * board, deduped, stripped of everything already taken or finished, and sorted
 * by distance so index 0 is literally "the next one".
 */
export function useNearbySideQuests(): NearbyQuest[] {
  const sideQuests = useSideQuestStore((s) => s.sideQuests);
  const quests = useQuestStore((s) => s.quests);
  const userLocation = useMapStore((s) => s.userLocation);
  const myId = useAuthStore((s) => s.user?.id);
  const now = useTick(30_000);

  return useMemo(() => {
    const byId = new Map<string, Quest>();
    // Side quests first — the spawner holds the freshest copy of them.
    for (const q of sideQuests) byId.set(q.id, q);
    for (const q of quests) if (!byId.has(q.id)) byId.set(q.id, q);

    return [...byId.values()]
      .filter((q) => {
        if (q.completedBy) return false;
        // Somebody else grabbed it → not mine to walk to.
        if (q.acceptedBy && q.acceptedBy !== myId) return false;
        if (q.expiresAt && new Date(q.expiresAt).getTime() <= now) return false;
        return true;
      })
      .map((quest) => ({
        quest,
        distance: userLocation
          ? haversineDistance(
              userLocation.lat,
              userLocation.lng,
              quest.lat,
              quest.lng,
            )
          : null,
      }))
      .sort((a, b) => {
        if (a.distance === null || b.distance === null) return 0;
        return a.distance - b.distance;
      });
  }, [sideQuests, quests, userLocation, myId, now]);
}

/** Wall clock that re-renders on an interval, so expiry checks stay pure. */
function useTick(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
