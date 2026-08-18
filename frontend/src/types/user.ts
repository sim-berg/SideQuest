import type { CharacterClass } from '../constants/characterClasses';
import type { Emblem } from './achievement';

/** A self-declared link on a profile. */
export interface ProfileLink {
  label: string;
  url: string;
  /** Icon hint the UI maps to a glyph ("instagram", "web", ...). */
  icon?: string;
}

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
  /** Short "what I'm up to" line shown next to the name. */
  status?: string;
  /** Signals that quest invites are welcome right now. */
  openForQuests?: boolean;
  /** Id from CHARACTER_CLASSES; empty when unset. */
  characterClass?: string;
  homeRegion?: string;
  accentColor?: string;
  links?: ProfileLink[];
  /** Emblem keys pinned to the top of the profile, in the chosen order. */
  featuredEmblems?: string[];
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

/** What other users may see of a profile. */
export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  profileCss: string;
  status: string;
  openForQuests: boolean;
  characterClass: CharacterClass | null;
  homeRegion: string;
  accentColor: string;
  links: ProfileLink[];
  level: number;
  questsCompleted: number;
  isOnline: boolean;
  lastSeenAt: string | null;
  joinedAt: string | null;
  loginStreak: number;
  dailyQuestStreak: number;
  emblemCount: number;
  /** The emblems the owner pinned, in their order. */
  featuredEmblems: Emblem[];
  /** The whole shelf, newest first. */
  emblems: Emblem[];
}

/** Compact user card used in lists (friends, search, requests). */
export interface UserCard {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: string;
  openForQuests: boolean;
  characterClass?: CharacterClass | null;
  level: number;
  questsCompleted?: number;
  isOnline: boolean;
  /** Only on the friends list. */
  friendsSince?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
