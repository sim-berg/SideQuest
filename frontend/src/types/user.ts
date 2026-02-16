export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  level: number;
  questsCompleted: number;
  isOnline: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
