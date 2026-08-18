import { create } from 'zustand';
import type { Metric, ProgressResult, Track } from '../types/track';
import {
  abandonTrack,
  acceptTrack,
  fetchMyTracks,
  fetchTrackPool,
  reportProgress,
} from '../services/track.service';

interface TrackState {
  /** Everything on offer. */
  pool: Track[];
  /** Only what the user accepted. */
  mine: Track[];
  loading: boolean;
  error: string | null;
  /** Slug of the track shown in the detail sheet, null when closed. */
  openSlug: string | null;
  /** Result of the last reported progress — drives the celebration toast. */
  lastResult: ProgressResult | null;

  loadPool: () => Promise<void>;
  loadMine: () => Promise<void>;
  accept: (slug: string) => Promise<void>;
  abandon: (slug: string) => Promise<void>;
  report: (input: {
    metric: Metric;
    value?: number;
    meta?: Record<string, unknown>;
    dedupeKey?: string;
  }) => Promise<ProgressResult | null>;
  open: (slug: string | null) => void;
  clearResult: () => void;
}

/**
 * Tracks and their progress.
 *
 * `pool` and `mine` are kept apart rather than derived from one list: the pool
 * is public and cacheable, while `mine` needs a login and changes on every
 * reported event.
 */
export const useTrackStore = create<TrackState>((set, get) => ({
  pool: [],
  mine: [],
  loading: false,
  error: null,
  openSlug: null,
  lastResult: null,

  loadPool: async () => {
    set({ loading: true, error: null });
    try {
      set({ pool: await fetchTrackPool(), loading: false });
    } catch {
      set({ error: 'Challenges konnten nicht geladen werden', loading: false });
    }
  },

  loadMine: async () => {
    try {
      set({ mine: await fetchMyTracks() });
    } catch {
      // Not logged in, or offline — the pool stays usable either way.
      set({ mine: [] });
    }
  },

  accept: async (slug) => {
    const updated = await acceptTrack(slug);
    set((s) => ({
      pool: s.pool.map((t) => (t.slug === slug ? updated : t)),
      mine: [updated, ...s.mine.filter((t) => t.slug !== slug)],
    }));
  },

  abandon: async (slug) => {
    const updated = await abandonTrack(slug);
    set((s) => ({
      pool: s.pool.map((t) => (t.slug === slug ? updated : t)),
      mine: s.mine.map((t) => (t.slug === slug ? updated : t)),
    }));
  },

  report: async (input) => {
    try {
      const result = await reportProgress(input);
      set({ lastResult: result });
      // Anything that moved changes the progress bars, so refresh the runs.
      if (result.deltas.length > 0) await get().loadMine();
      return result;
    } catch {
      set({ error: 'Fortschritt konnte nicht gespeichert werden' });
      return null;
    }
  },

  open: (slug) => set({ openSlug: slug }),
  clearResult: () => set({ lastResult: null }),
}));
