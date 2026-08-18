/** A note left on someone's profile wall. */
export interface ProfileComment {
  id: string;
  profileUserId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
}
