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
  createdAt: string;
}

export interface QuestFilter {
  categories: Category[];
  distanceKm: number;
  paidOnly: boolean;
  timedOnly: boolean;
}
