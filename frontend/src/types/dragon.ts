export const DragonType = {
  EMBER: 'ember',
  TIDE: 'tide',
  THORN: 'thorn',
  GLOOM: 'gloom',
  SPARK: 'spark',
} as const;

export type DragonType = (typeof DragonType)[keyof typeof DragonType];

export const EvolutionStage = {
  EGG: 'egg',
  HATCHLING: 'hatchling',
  WHELP: 'whelp',
  DRAKE: 'drake',
  ELDER_DRAGON: 'elder_dragon',
} as const;

export type EvolutionStage = (typeof EvolutionStage)[keyof typeof EvolutionStage];

export type DragonMood = 'happy' | 'content' | 'lonely' | 'sad';

export interface Dragon {
  id: string;
  userId: string;
  type: DragonType;
  name: string | null;
  xp: number;
  evolutionStage: EvolutionStage;
  currentStreak: number;
  lastStreakDate: string | null;
  lastQuestCompletedAt: string | null;
  questsCompletedToday: number;
  lastQuestDate: string | null;
  createdAt: string;
}

export interface XpResult {
  xpAwarded: number;
  bonusBreakdown: {
    baseXp: number;
    firstOfDayBonus: number;
    streakMultiplier: number;
    streak: number;
  };
  dragon: Dragon;
}
