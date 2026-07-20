import { create } from 'zustand';
import type { Quest } from '../types/quest';
import { fetchWalkingRoute, type RouteResult } from '../services/routing.service';
import { useMapStore } from './useMapStore';

interface RouteState {
  /** Quest we're currently navigating to (null = no active route). */
  destination: Quest | null;
  /** Street geometry + distance/ETA, once OSRM has answered. */
  route: RouteResult | null;
  loading: boolean;
  error: string | null;
  /** Whether the full-screen Adventure-mode compass is showing. */
  compassOpen: boolean;

  planRoute: (quest: Quest) => Promise<void>;
  clearRoute: () => void;
  openCompass: (quest?: Quest) => void;
  closeCompass: () => void;
}

/** In-flight request, so a second tap supersedes the first instead of racing it. */
let inflight: AbortController | null = null;

export const useRouteStore = create<RouteState>((set, get) => ({
  destination: null,
  route: null,
  loading: false,
  error: null,
  compassOpen: false,

  planRoute: async (quest) => {
    const userLocation = useMapStore.getState().userLocation;
    if (!userLocation) {
      set({
        destination: quest,
        route: null,
        loading: false,
        error: 'Standort nicht verfügbar - Route kann nicht berechnet werden',
      });
      return;
    }

    inflight?.abort();
    const controller = new AbortController();
    inflight = controller;

    set({ destination: quest, route: null, loading: true, error: null });

    try {
      const route = await fetchWalkingRoute(
        userLocation,
        { lat: quest.lat, lng: quest.lng },
        controller.signal,
      );
      // A newer request (or a clear) took over while we were waiting.
      if (inflight !== controller) return;
      set({ route, loading: false });
    } catch (e) {
      if (controller.signal.aborted || inflight !== controller) return;
      set({
        route: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Route konnte nicht berechnet werden',
      });
    } finally {
      if (inflight === controller) inflight = null;
    }
  },

  clearRoute: () => {
    inflight?.abort();
    inflight = null;
    set({ destination: null, route: null, loading: false, error: null, compassOpen: false });
  },

  openCompass: (quest) => {
    const destination = quest ?? get().destination;
    if (!destination) return;
    set({ destination, compassOpen: true });
  },

  closeCompass: () => set({ compassOpen: false }),
}));
