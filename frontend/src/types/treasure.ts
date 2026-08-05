export const Rarity = {
  BASIC: 'basic',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export type Rarity = (typeof Rarity)[keyof typeof Rarity];

export type EffectType =
  | 'xp_boost'
  | 'dragon_xp'
  | 'luck'
  | 'treasure_sense'
  | 'cosmetic';

export interface ItemEffect {
  type: EffectType;
  value: number;
  description: string;
}

export type ItemTarget = 'player' | 'dragon' | 'cosmetic';

export interface TreasureItem {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  target: ItemTarget;
  effects: ItemEffect[];
  lore: string;
  craftOnly?: boolean;
}

/** A chest on the map, dropped by the backend spawner worker. */
export interface TreasureSpawn {
  id: string;
  itemId: string;
  rarity: Rarity;
  lat: number;
  lng: number;
  expiresAt: string;
  item: TreasureItem;
}

export interface ItemHistoryEvent {
  event: 'found' | 'stacked' | 'crafted' | 'lucky_double';
  date: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
}

/** One inventory stack: item + copies owned + per-item history. */
export interface InventoryEntry {
  itemId: string;
  stackCount: number;
  effectiveRarity: Rarity;
  item: TreasureItem;
  history: ItemHistoryEvent[];
  updatedAt: string | null;
}

export interface ActiveBonuses {
  xpBoost: number;
  dragonXp: number;
  luck: number;
  treasureSenseMeters: number;
}

export interface Inventory {
  items: InventoryEntry[];
  bonuses: ActiveBonuses;
}

export interface RecipeIngredientView {
  itemId: string;
  count: number;
  name: string;
  emoji: string;
  owned: number;
}

export interface CraftingRecipeView {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockHint: string | null;
  craftable: boolean;
  ingredients: RecipeIngredientView[];
  result: { itemId: string; name: string; emoji: string; rarity: Rarity };
}

export interface CollectResult {
  entry: InventoryEntry;
  stackFull: boolean;
  luckyDouble: boolean;
  upgraded: boolean;
}

export interface CraftResult {
  recipe: { id: string; name: string };
  entry: InventoryEntry;
}
