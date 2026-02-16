import { api } from './api';
import type { Quest } from '../types/quest';

export async function fetchQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests');
}

export async function fetchQuestById(id: string): Promise<Quest> {
  return api.get<Quest>(`/quests/${id}`);
}

export async function createQuest(
  quest: Omit<Quest, 'id' | 'createdAt'>,
): Promise<Quest> {
  return api.post<Quest>('/quests', quest);
}
