export enum Rarity {
  BASIC = 'basic',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

/** Ordered from most common to rarest — index doubles as the tier number. */
export const RARITY_ORDER: Rarity[] = [
  Rarity.BASIC,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.LEGENDARY,
];

export function rarityTier(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

/** Bump a rarity by `steps` tiers, capped at legendary. */
export function upgradeRarity(rarity: Rarity, steps: number): Rarity {
  const idx = Math.min(rarityTier(rarity) + steps, RARITY_ORDER.length - 1);
  return RARITY_ORDER[idx];
}
