import { api } from './api';
import type { Quest, EventParticipation, Category } from '../types/quest';
import type { XpResult } from '../types/pet';
import type { Achievement } from '../types/achievement';

export interface CompleteQuestResult {
  quest: Quest;
  xpResult: XpResult | null;
  achievements: Achievement[];
  coinsAwarded?: number;
}

export async function fetchQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests');
}

export async function fetchQuestById(id: string): Promise<Quest> {
  return api.get<Quest>(`/quests/${id}`);
}

/** Fields the create endpoint accepts (mirrors the backend CreateQuestDto). */
export interface CreateQuestPayload {
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  category: Category;
  questGiver: { name: string; avatar?: string };
  reward?: number;
  timeLimit?: string;
  difficulty?: Quest['difficulty'];
  goalType?: Quest['goalType'];
  goalCount?: number | null;
}

export async function createQuest(quest: CreateQuestPayload): Promise<Quest> {
  return api.post<Quest>('/quests', quest);
}

export async function acceptQuest(id: string): Promise<Quest> {
  return api.post<Quest>(`/quests/${id}/accept`, {});
}

export async function completeQuest(
  id: string,
  payload: { lat?: number; lng?: number; countCompleted?: number } = {},
): Promise<CompleteQuestResult> {
  return api.post<CompleteQuestResult>(`/quests/${id}/complete`, payload);
}

export async function abandonQuest(id: string): Promise<Quest> {
  return api.post<Quest>(`/quests/${id}/abandon`, {});
}

export async function fetchMyActiveQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests/my/active');
}

/** Lazily generated illustrative image (Replicate) for a quest's detail modal. */
export async function fetchQuestImage(id: string): Promise<string | null> {
  const res = await api.get<{ imageUrl: string | null }>(
    `/sidequests/${id}/image`,
  );
  return res.imageUrl;
}

export async function fetchMyCompletedQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests/my/completed');
}

export async function fetchDailyQuests(): Promise<Quest[]> {
  return api.get<Quest[]>('/quests/daily');
}

// --- Event quests (user-organized gatherings) ------------------------------

export interface CreateEventQuestPayload {
  title: string;
  description: string;
  lat: number;
  lng: number;
  address?: string;
  category: Category;
  rewardPerParticipant: number;
  maxParticipants: number;
  requiredMinutes: number;
  durationHours: number;
  presenceRadiusM?: number;
}

export async function createEventQuest(
  payload: CreateEventQuestPayload,
): Promise<Quest> {
  return api.post<Quest>('/quests/events', payload);
}

export async function joinEvent(id: string): Promise<EventParticipation> {
  return api.post<EventParticipation>(`/quests/${id}/event/join`);
}

/** Presence heartbeat from inside the event radius (~every 60s). */
export async function eventCheckin(
  id: string,
  lat: number,
  lng: number,
): Promise<EventParticipation> {
  return api.post<EventParticipation>(`/quests/${id}/event/checkin`, {
    lat,
    lng,
  });
}

export async function claimEventReward(id: string): Promise<{
  coins: number;
  xpResult: XpResult | null;
  participation: EventParticipation;
}> {
  return api.post(`/quests/${id}/event/claim`);
}

export async function fetchEventParticipation(
  id: string,
): Promise<EventParticipation> {
  return api.get<EventParticipation>(`/quests/${id}/event/participation`);
}

export async function finalizeEvent(
  id: string,
): Promise<{ refunded: number }> {
  return api.post(`/quests/${id}/event/finalize`);
}

// --- World quests (QR-redeemed) --------------------------------------------

export async function redeemWorldQuest(
  id: string,
  code: string,
): Promise<{ coins: number; xpResult: XpResult | null }> {
  return api.post(`/quests/${id}/redeem`, { code });
}

export async function fetchRedemptionState(id: string): Promise<{
  redeemed: boolean;
  redeemedAt: string | null;
  coins: number | null;
}> {
  return api.get(`/quests/${id}/redemption`);
}
