import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/useMapStore';
import { useTreasureStore } from '../stores/useTreasureStore';
import { fetchNearbyTreasures } from '../services/treasure.service';

const POLL_INTERVAL_MS = 30_000;

/**
 * Mirrors the backend treasure spawns near the player into the store. The
 * poll doubles as the "activity beacon" that tells the spawn worker where
 * players currently are; expired chests are pruned client-side between polls.
 */
export function useTreasureSpawner() {
  const userLocation = useMapStore((s) => s.userLocation);
  const setSpawns = useTreasureStore((s) => s.setSpawns);
  const markSeen = useTreasureStore((s) => s.markSeen);
  const lastFetch = useRef(0);

  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;

    const load = async () => {
      try {
        const spawns = await fetchNearbyTreasures(
          userLocation.lat,
          userLocation.lng,
        );
        if (cancelled) return;
        setSpawns(spawns);
        // Mark seen after a render tick so new chests play their pop-in.
        const ids = spawns.map((s) => s.id);
        setTimeout(() => markSeen(ids), 1500);
        lastFetch.current = Date.now();
      } catch {
        // ignore — keep showing the last known chests
      }
    };

    if (Date.now() - lastFetch.current > POLL_INTERVAL_MS / 3) {
      void load();
    }

    const interval = setInterval(load, POLL_INTERVAL_MS);

    const pruner = setInterval(() => {
      const now = Date.now();
      const current = useTreasureStore.getState().spawns;
      const alive = current.filter(
        (s) => new Date(s.expiresAt).getTime() > now,
      );
      if (alive.length !== current.length) setSpawns(alive);
    }, 5_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(pruner);
    };
  }, [userLocation, setSpawns, markSeen]);
}
