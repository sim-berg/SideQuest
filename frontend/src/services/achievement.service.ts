import { api } from './api';
import type { Achievement, Emblem } from '../types/achievement';

export async function fetchMyAchievements(): Promise<Emblem[]> {
  return api.get<Emblem[]>('/achievements/mine');
}

export async function fetchAchievementCatalog(): Promise<Achievement[]> {
  return api.get<Achievement[]>('/achievements/catalog');
}

/** Another user's emblem shelf, with the log of how each was earned. */
export async function fetchUserEmblems(userId: string): Promise<Emblem[]> {
  return api.get<Emblem[]>(`/achievements/user/${userId}`);
}

export async function fetchUserEmblem(
  userId: string,
  key: string,
): Promise<Emblem> {
  return api.get<Emblem>(`/achievements/user/${userId}/${key}`);
}
