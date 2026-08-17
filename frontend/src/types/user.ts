export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  /** User-authored CSS for the profile card (sanitized server-side). */
  profileCss?: string;
  /** Alias for pseudonymous quests — only present on the own profile. */
  pseudonym?: string;
  level: number;
  questsCompleted: number;
  isOnline: boolean;
  shareLocation: boolean;
  hasDragon: boolean;
}

/** Structured soul of the user, derived from completed quests. */
export interface UserSoul {
  /** The LLM-written soul.md (may be empty early on). */
  content: string;
  questsCompleted: number;
  dailyStreak: number;
  longestDailyStreak: number;
  categoryCounts: Record<string, number>;
  elementScores: Record<string, number>;
  dominantElement: {
    id: string;
    score: number;
    name: string;
    emoji: string;
    color: string;
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
