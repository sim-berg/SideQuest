import { api } from './api';
import type { Quest } from '../types/quest';
import type { DailyBoard, DailySideQuest } from '../types/sidequest';
import type { Pet, XpResult } from '../types/pet';
import type { Achievement } from '../types/achievement';

/**
 * Fetch (and lazily spawn) side quests around a point. The backend tops up the
 * active pool and despawns expired ones, so this can be polled.
 */
export async function fetchNearbySideQuests(
  lat: number,
  lng: number,
  radiusKm?: number,
): Promise<Quest[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  if (radiusKm != null) params.set('radius', String(radiusKm));
  return api.get<Quest[]>(`/sidequests/nearby?${params.toString()}`);
}

export interface DailyCompleteResult {
  daily: DailySideQuest;
  xpResult: XpResult | null;
  achievements: Achievement[];
  /** Extra XP granted for clearing the whole board (0 when not cleared). */
  bonusXp: number;
  /** The freshly hatched pet when clearing this board cracked the egg. */
  hatch: Pet | null;
  board: DailyBoard;
}

/** Today's per-user daily quest board (generated on first call). */
export async function fetchDailyBoard(): Promise<DailyBoard> {
  return api.get<DailyBoard>('/sidequests/daily');
}

export async function completeDailySideQuest(
  id: string,
): Promise<DailyCompleteResult> {
  return api.post<DailyCompleteResult>(`/sidequests/daily/${id}/complete`, {});
}
