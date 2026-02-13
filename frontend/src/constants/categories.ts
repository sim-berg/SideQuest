import { Category } from '../types/quest';

export interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  [Category.SPORT]: {
    label: 'Sport',
    color: '#22c55e',
    bgColor: 'bg-quest-sport',
    icon: '🏃',
  },
  [Category.SOCIAL]: {
    label: 'Social',
    color: '#3b82f6',
    bgColor: 'bg-quest-social',
    icon: '👥',
  },
  [Category.ADVENTURE]: {
    label: 'Abenteuer',
    color: '#f59e0b',
    bgColor: 'bg-quest-adventure',
    icon: '⚔️',
  },
  [Category.SKILL]: {
    label: 'Skill',
    color: '#a855f7',
    bgColor: 'bg-quest-skill',
    icon: '🧠',
  },
  [Category.MYSTERY]: {
    label: 'Mystery',
    color: '#ef4444',
    bgColor: 'bg-quest-mystery',
    icon: '🔮',
  },
};
