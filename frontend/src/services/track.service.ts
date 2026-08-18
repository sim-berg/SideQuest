import { api } from './api';
import type {
  Metric,
  ProgressHistoryEntry,
  ProgressResult,
  ProgressSource,
  Track,
  TrackKind,
} from '../types/track';

/** The pool — every published challenge and story arc. */
export async function fetchTrackPool(opts?: {
  kind?: TrackKind;
  tag?: string;
}): Promise<Track[]> {
  const params = new URLSearchParams();
  if (opts?.kind) params.set('kind', opts.kind);
  if (opts?.tag) params.set('tag', opts.tag);
  const qs = params.toString();
  return api.get<Track[]>(`/tracks${qs ? `?${qs}` : ''}`);
}

/** Only what the user accepted — the monitoring view. */
export async function fetchMyTracks(): Promise<Track[]> {
  return api.get<Track[]>('/tracks/mine');
}

export async function fetchTrack(slug: string): Promise<Track> {
  return api.get<Track>(`/tracks/${slug}`);
}

/** The "Annehmen" CTA. Idempotent — re-accepting resumes an abandoned run. */
export async function acceptTrack(slug: string): Promise<Track> {
  return api.post<Track>(`/tracks/${slug}/accept`, {});
}

export async function abandonTrack(slug: string): Promise<Track> {
  return api.post<Track>(`/tracks/${slug}/abandon`, {});
}

/**
 * Report that something happened.
 *
 * Deliberately does not name a track: the caller states a fact ("ich war heute
 * rauchfrei", "5,2 km gelaufen") and the backend advances every enrollment that
 * listens on that metric. `dedupeKey` makes a double tap or an offline retry
 * count exactly once.
 */
export async function reportProgress(input: {
  metric: Metric;
  value?: number;
  source?: ProgressSource;
  meta?: Record<string, unknown>;
  dedupeKey?: string;
}): Promise<ProgressResult> {
  return api.post<ProgressResult>('/tracks/progress', {
    ...input,
    // Streak days must line up with the user's midnight, not UTC's.
    tzOffsetMinutes: new Date().getTimezoneOffset(),
  });
}

export async function fetchProgressHistory(opts?: {
  metric?: Metric;
  limit?: number;
}): Promise<ProgressHistoryEntry[]> {
  const params = new URLSearchParams();
  if (opts?.metric) params.set('metric', opts.metric);
  if (opts?.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return api.get<ProgressHistoryEntry[]>(`/tracks/history${qs ? `?${qs}` : ''}`);
}
