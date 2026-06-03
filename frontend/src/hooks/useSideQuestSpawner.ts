import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/useMapStore';
import { useSideQuestStore } from '../stores/useSideQuestStore';
import { useAuthStore } from '../stores/useAuthStore';
import { fetchNearbySideQuests } from '../services/sidequest.service';

const POLL_INTERVAL_MS = 30_000;

/**
 * Periodically asks the backend for side quests near the player. The backend
 * lazily spawns and despawns, so we just mirror the result into the store and
 * prune client-side expired ones between polls.
 */
export function useSideQuestSpawner() {
  const userLocation = useMapStore((s) => s.userLocation);
  const setSideQuests = useSideQuestStore((s) => s.setSideQuests);
  const markSeen = useSideQuestStore((s) => s.markSeen);
  const lastFetch = useRef(0);

  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;

    const load = async () => {
      try {
        const quests = await fetchNearbySideQuests(
          userLocation.lat,
          userLocation.lng,
        );
        if (cancelled) return;

        // The nearby endpoint excludes accepted spawns (it's stateless/public),
        // so retain the side quests *I* accepted and haven't finished — they
        // must stay on the map until I complete or abandon them.
        const myId = useAuthStore.getState().user?.id;
        const now = Date.now();
        const retained = useSideQuestStore.getState().sideQuests.filter(
          (q) =>
            q.acceptedBy &&
            q.acceptedBy === myId &&
            !q.completedBy &&
            (!q.expiresAt || new Date(q.expiresAt).getTime() > now) &&
            !quests.some((n) => n.id === q.id),
        );
        setSideQuests([...quests, ...retained]);
        // Mark everything seen *after* one render tick so the marker layer can
        // play the spawn-pop animation for genuinely new ids.
        const ids = quests.map((q) => q.id);
        setTimeout(() => markSeen(ids), 1500);
        lastFetch.current = Date.now();
      } catch {
        // ignore — keep showing the last known spawns
      }
    };

    // Avoid hammering on every tiny GPS jitter: only refetch if enough time passed.
    if (Date.now() - lastFetch.current > POLL_INTERVAL_MS / 3) {
      void load();
    }

    const interval = setInterval(load, POLL_INTERVAL_MS);

    // Client-side expiry prune so cards vanish even between polls.
    const pruner = setInterval(() => {
      const now = Date.now();
      const current = useSideQuestStore.getState().sideQuests;
      const alive = current.filter(
        (q) => !q.expiresAt || new Date(q.expiresAt).getTime() > now,
      );
      if (alive.length !== current.length) setSideQuests(alive);
    }, 5_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(pruner);
    };
  }, [userLocation, setSideQuests, markSeen]);
}
