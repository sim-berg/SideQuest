import type { Category, Difficulty } from './quest';

export interface DailySideQuest {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  /** Flavor icon from the template ('' for quests created before emojis). */
  emoji: string;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
  date: string;
}

/** Today's three daily quests plus the streak they build. */
export interface DailyBoard {
  date: string;
  quests: DailySideQuest[];
  completed: number;
  total: number;
  allDone: boolean;
  streak: number;
  longestStreak: number;
  /** Today already counted towards the streak. */
  secured: boolean;
}
