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
    color: '#4a9e5c',
    bgColor: 'bg-quest-sport',
    icon: '',
  },
  [Category.SOCIAL]: {
    label: 'Social',
    color: '#4a7ab5',
    bgColor: 'bg-quest-social',
    icon: '',
  },
  [Category.ADVENTURE]: {
    label: 'Abenteuer',
    color: '#c48a2a',
    bgColor: 'bg-quest-adventure',
    icon: '',
  },
  [Category.SKILL]: {
    label: 'Skill',
    color: '#8b5fb0',
    bgColor: 'bg-quest-skill',
    icon: '',
  },
  [Category.MYSTERY]: {
    label: 'Mystery',
    color: '#b5443a',
    bgColor: 'bg-quest-mystery',
    icon: '',
  },
};
