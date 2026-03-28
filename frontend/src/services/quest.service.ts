import { api } from './api';
import type { Quest } from '../types/quest';
import type { XpResult } from '../types/dragon';

export async function fetchQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests');
}

export async function fetchQuestById(id: string): Promise<Quest> {
  return api.get<Quest>(`/quests/${id}`);
}

export async function createQuest(
  quest: Omit<Quest, 'id' | 'createdAt' | 'acceptedBy' | 'acceptedAt' | 'completedBy' | 'completedAt'>,
): Promise<Quest> {
  return api.post<Quest>('/quests', quest);
}

export async function acceptQuest(id: string): Promise<Quest> {
  return api.post<Quest>(`/quests/${id}/accept`, {});
}

export async function completeQuest(
  id: string,
  lat: number,
  lng: number,
): Promise<{ quest: Quest; xpResult: XpResult }> {
  return api.post<{ quest: Quest; xpResult: XpResult }>(
    `/quests/${id}/complete`,
    { lat, lng },
  );
}

export async function abandonQuest(id: string): Promise<Quest> {
  return api.post<Quest>(`/quests/${id}/abandon`, {});
}

export async function fetchMyActiveQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests/my/active');
}

export async function fetchMyCompletedQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests/my/completed');
}
