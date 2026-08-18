import { api } from './api';
import type { FriendRequest, RelationView } from '../types/friendship';
import type { UserCard } from '../types/user';

/** Kumpane — SideQuest's word for confirmed friends. */
export async function fetchFriends(): Promise<UserCard[]> {
  return api.get<UserCard[]>('/friends');
}

export async function fetchIncomingRequests(): Promise<FriendRequest[]> {
  return api.get<FriendRequest[]>('/friends/requests/incoming');
}

export async function fetchOutgoingRequests(): Promise<FriendRequest[]> {
  return api.get<FriendRequest[]>('/friends/requests/outgoing');
}

export async function fetchPendingCount(): Promise<number> {
  const res = await api.get<{ pending: number }>('/friends/requests/count');
  return res.pending;
}

export async function fetchFriendCount(userId: string): Promise<number> {
  const res = await api.get<{ friends: number }>(`/friends/count/${userId}`);
  return res.friends;
}

export async function fetchRelation(userId: string): Promise<RelationView> {
  return api.get<RelationView>(`/friends/status/${userId}`);
}

export async function sendFriendRequest(
  userId: string,
  message = '',
): Promise<{ status: string; id: string }> {
  return api.post(`/friends/request/${userId}`, { message });
}

export async function acceptFriendRequest(requestId: string) {
  return api.post(`/friends/requests/${requestId}/accept`);
}

export async function declineFriendRequest(requestId: string) {
  return api.post(`/friends/requests/${requestId}/decline`);
}

/** Withdraw a sent request, or end a friendship. */
export async function removeFriend(userId: string) {
  return api.del(`/friends/${userId}`);
}
