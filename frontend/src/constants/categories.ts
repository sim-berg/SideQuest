import { Category } from '../types/quest';

export interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
  /** Emoji fallback (used where the sticker doesn't fit or fails to load). */
  icon: string;
  /** Generated die-cut sticker icon (fofr/sticker-maker), 256×256 PNG. */
  sticker: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  [Category.SPORT]: {
    label: 'Sport',
    color: '#22c55e',
    bgColor: 'bg-quest-sport',
    icon: '🏃',
    sticker: '/icons/quests/sport.png',
  },
  [Category.SOCIAL]: {
    label: 'Social',
    color: '#3b82f6',
    bgColor: 'bg-quest-social',
    icon: '👥',
    sticker: '/icons/quests/social.png',
  },
  [Category.ADVENTURE]: {
    label: 'Abenteuer',
    color: '#f59e0b',
    bgColor: 'bg-quest-adventure',
    icon: '⚔️',
    sticker: '/icons/quests/adventure.png',
  },
  [Category.SKILL]: {
    label: 'Skill',
    color: '#a855f7',
    bgColor: 'bg-quest-skill',
    icon: '🧠',
    sticker: '/icons/quests/skill.png',
  },
  [Category.MYSTERY]: {
    label: 'Mystery',
    color: '#ef4444',
    bgColor: 'bg-quest-mystery',
    icon: '🔮',
    sticker: '/icons/quests/mystery.png',
  },
};
