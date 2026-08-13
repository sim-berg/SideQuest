import { api } from './api';
import type { Comment } from '../types/comment';
import type { UserSoul } from '../types/user';

export interface CheckinResult {
  streak: number;
  isNewDay: boolean;
  totalXp: number;
  questsCompleted: number;
}

export async function dailyCheckin(): Promise<CheckinResult> {
  return api.post<CheckinResult>('/users/me/checkin');
}

export async function fetchMyComments(): Promise<Comment[]> {
  return api.get<Comment[]>('/users/me/comments');
}

export interface ActivityData {
  date: string;
  count: number;
}

export async function fetchActivity(): Promise<ActivityData[]> {
  return api.get<ActivityData[]>('/users/me/activity');
}

/** My soul: soul.md + category/element affinity from completed quests. */
export async function fetchMySoul(): Promise<UserSoul> {
  return api.get<UserSoul>('/users/me/soul');
}
