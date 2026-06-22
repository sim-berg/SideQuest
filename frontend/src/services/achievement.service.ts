import { api } from './api';
import type { Achievement } from '../types/achievement';

export async function fetchMyAchievements(): Promise<Achievement[]> {
  return api.get<Achievement[]>('/achievements/mine');
}

export async function fetchAchievementCatalog(): Promise<Achievement[]> {
  return api.get<Achievement[]>('/achievements/catalog');
}
