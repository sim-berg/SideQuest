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
    color: '#39ff14',
    bgColor: 'bg-quest-sport',
    icon: '',
  },
  [Category.SOCIAL]: {
    label: 'Social',
    color: '#00b4ff',
    bgColor: 'bg-quest-social',
    icon: '',
  },
  [Category.ADVENTURE]: {
    label: 'Abenteuer',
    color: '#ff6b00',
    bgColor: 'bg-quest-adventure',
    icon: '',
  },
  [Category.SKILL]: {
    label: 'Skill',
    color: '#b44aff',
    bgColor: 'bg-quest-skill',
    icon: '',
  },
  [Category.MYSTERY]: {
    label: 'Mystery',
    color: '#ff1a6d',
    bgColor: 'bg-quest-mystery',
    icon: '',
  },
};
