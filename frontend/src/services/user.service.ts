import { api } from './api';
import type { Comment } from '../types/comment';
import type { PublicProfile, User, UserCard, UserSoul } from '../types/user';

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

export type { PublicProfile } from '../types/user';

export async function fetchPublicProfile(id: string): Promise<PublicProfile> {
  return api.get<PublicProfile>(`/users/${id}`);
}

/** Everything the profile editor may change, all optional. */
export type ProfileUpdate = Partial<
  Pick<
    User,
    | 'displayName'
    | 'bio'
    | 'profileCss'
    | 'pseudonym'
    | 'avatarUrl'
    | 'status'
    | 'openForQuests'
    | 'characterClass'
    | 'homeRegion'
    | 'accentColor'
    | 'links'
    | 'featuredEmblems'
    | 'shareLocation'
  >
>;

export async function updateMyProfile(patch: ProfileUpdate): Promise<User> {
  return api.patch<User>('/users/me', patch);
}

/** Find people by username or display name. */
export async function searchUsers(query: string): Promise<UserCard[]> {
  if (!query.trim()) return [];
  return api.get<UserCard[]>(`/users/search?q=${encodeURIComponent(query)}`);
}
