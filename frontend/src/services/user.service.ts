import { api } from './api';
import type { Comment } from '../types/comment';

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
