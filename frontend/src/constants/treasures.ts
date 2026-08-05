import { Rarity } from '../types/treasure';
import type { EffectType, ItemTarget } from '../types/treasure';

export interface RarityMeta {
  label: string;
  /** Accent color for markers, borders, glows. */
  color: string;
  /** Tailwind text color class. */
  textClass: string;
  /** Tailwind border color class for item cards. */
  borderClass: string;
  /** Sort order, common → legendary. */
  tier: number;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  [Rarity.BASIC]: {
    label: 'Gewöhnlich',
    color: '#94a3b8',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-400/60',
    tier: 0,
  },
  [Rarity.UNCOMMON]: {
    label: 'Ungewöhnlich',
    color: '#22c55e',
    textClass: 'text-green-500',
    borderClass: 'border-green-500/60',
    tier: 1,
  },
  [Rarity.RARE]: {
    label: 'Selten',
    color: '#3b82f6',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500/60',
    tier: 2,
  },
  [Rarity.EPIC]: {
    label: 'Episch',
    color: '#a855f7',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500/60',
    tier: 3,
  },
  [Rarity.LEGENDARY]: {
    label: 'Legendär',
    color: '#f59e0b',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/70',
    tier: 4,
  },
};

export const EFFECT_LABEL: Record<EffectType, string> = {
  xp_boost: 'XP-Bonus',
  dragon_xp: 'Drachen-XP',
  luck: 'Glück',
  treasure_sense: 'Schatz-Sinn',
  cosmetic: 'Kosmetisch',
};

export const TARGET_LABEL: Record<ItemTarget, string> = {
  player: 'Für dich',
  dragon: 'Für deinen Drachen',
  cosmetic: 'Kosmetisch',
};
