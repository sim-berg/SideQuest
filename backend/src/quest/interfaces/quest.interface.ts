import { Category } from '../enums/category.enum.js';
import { Difficulty } from '../enums/difficulty.enum.js';
import { GoalType } from '../enums/goal-type.enum.js';

export interface QuestGiver {
  name: string;
  avatar?: string;
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
  createdAt: string;
}
