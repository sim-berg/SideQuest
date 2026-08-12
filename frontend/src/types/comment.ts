export interface Comment {
  id: string;
  questId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
}
