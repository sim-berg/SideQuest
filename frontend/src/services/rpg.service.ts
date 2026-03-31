import { api } from './api';
import type { RpgQuest, ZoneType, CompleteQuestResult } from '../types/rpg';

export function getRpgQuests(zone: ZoneType): Promise<RpgQuest[]> {
  return api.get<RpgQuest[]>(`/rpg/quests?zone=${zone}`);
}

export function completeRpgQuest(templateId: string): Promise<CompleteQuestResult> {
  return api.post<CompleteQuestResult>('/rpg/quests/complete', { templateId });
}

export function getMyRpgQuests() {
  return api.get('/rpg/quests/mine');
}
