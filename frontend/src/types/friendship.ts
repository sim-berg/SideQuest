import type { UserCard } from './user';

/** How the viewing user stands towards another user. */
export type FriendshipRelation =
  | 'none'
  | 'friends'
  | 'request_sent'
  | 'request_received'
  | 'declined';

export interface RelationView {
  relation: FriendshipRelation;
  /** Id of the underlying request, when there is one to act on. */
  requestId: string | null;
  since: string | null;
}

/** A pending Kumpanen request, incoming or outgoing. */
export interface FriendRequest {
  id: string;
  user: UserCard;
  message: string;
  createdAt: string;
}
