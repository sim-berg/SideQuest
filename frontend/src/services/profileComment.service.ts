import { api } from './api';
import type { ProfileComment } from '../types/profileComment';

/** The guest book on someone's profile. */
export async function fetchProfileComments(
  userId: string,
): Promise<ProfileComment[]> {
  return api.get<ProfileComment[]>(`/users/${userId}/wall`);
}

export async function postProfileComment(
  userId: string,
  body: string,
): Promise<ProfileComment> {
  return api.post<ProfileComment>(`/users/${userId}/wall`, { body });
}

export async function deleteProfileComment(userId: string, commentId: string) {
  return api.del(`/users/${userId}/wall/${commentId}`);
}
