import type { Category, Difficulty } from './quest';

export interface DailySideQuest {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
  date: string;
}
