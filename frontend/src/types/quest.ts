export const Category = {
  SPORT: 'sport',
  SOCIAL: 'social',
  ADVENTURE: 'adventure',
  SKILL: 'skill',
  MYSTERY: 'mystery',
} as const;

export type Category = (typeof Category)[keyof typeof Category];

export interface QuestGiver {
  name: string;
  avatar?: string;
}

export const Difficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const GoalType = {
  PROXIMITY: 'proximity',
  MANUAL: 'manual',
  COUNT: 'count',
} as const;

export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const QuestType = {
  /** Solo quests: map quests, worker-spawned side quests, Logbuch dailies. */
  PERSONAL: 'personal',
  /** User-organized gatherings with a coin-staked reward pool. */
  EVENT: 'event',
  /** Firm-organized events, redeemed by scanning a QR code on site. */
  WORLD: 'world',
  /** Guild quests (guild system pending). */
  COMMUNITY: 'community',
} as const;

export type QuestType = (typeof QuestType)[keyof typeof QuestType];

/** My presence state at an event quest. */
export interface EventParticipation {
  joined: boolean;
  presenceMinutes: number;
  requiredMinutes: number;
  qualified: boolean;
  rewardPaid: boolean;
  participantCount: number;
  maxParticipants: number;
  eventEndsAt: string | null;
  ended: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  category: Category;
  questGiver: QuestGiver;
  reward?: number;
  timeLimit?: string;
  difficulty: Difficulty;
  goalType: GoalType;
  goalCount: number | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  isSideQuest?: boolean;
  expiresAt?: string | null;
  templateId?: string | null;
  type: QuestType;
  /** Author's user id — null for pseudonymous quests (no profile link). */
  createdBy: string | null;
  /** Display name of the author (their pseudonym when pseudonymous). */
  creatorName?: string | null;
  pseudonymous?: boolean;
  // Event quest fields (type=event)
  eventEndsAt: string | null;
  requiredMinutes: number | null;
  presenceRadiusM: number | null;
  rewardPerParticipant: number | null;
  maxParticipants: number | null;
  eventFinalized: boolean;
  // World quest fields (type=world)
  hasQr: boolean;
  createdAt: string;
}

export interface QuestFilter {
  categories: Category[];
  distanceKm: number;
  paidOnly: boolean;
  timedOnly: boolean;
}
