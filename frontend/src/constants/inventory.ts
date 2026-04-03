import type { ItemRarity, WeaponStat, ArmorStat } from '../types/inventory';

// ── Weapon unlock levels ──────────────────────────────────────────────────────
// Each entry: { templateId, requiredLevel }
export const WEAPON_UNLOCKS: { templateId: string; requiredLevel: number }[] = [
  { templateId: 'sword',  requiredLevel: 1  },
  { templateId: 'dagger', requiredLevel: 3  },
  { templateId: 'spear',  requiredLevel: 6  },
  { templateId: 'staff',  requiredLevel: 10 },
];

// ── Armor unlock levels ───────────────────────────────────────────────────────
export const ARMOR_UNLOCKS: { templateId: string; requiredLevel: number; name: string; description: string; baseDefense: number }[] = [
  { templateId: 'cloth',   requiredLevel: 1,  name: 'Leinengewand',        description: 'Leichter Stoff, kaum Schutz',     baseDefense: 2  },
  { templateId: 'leather', requiredLevel: 4,  name: 'Lederrüstung',        description: 'Flexibel und leicht',             baseDefense: 6  },
  { templateId: 'chain',   requiredLevel: 7,  name: 'Kettenhemd',          description: 'Solide mittelschwere Rüstung',    baseDefense: 12 },
  { templateId: 'plate',   requiredLevel: 12, name: 'Plattenrüstung',      description: 'Schwer aber bestmöglich Schutz',  baseDefense: 20 },
];

// ── Chest upgrade tables ──────────────────────────────────────────────────────
// Chance that a loot tier grants a stat upgrade to a matching weapon/armor
export const CHEST_UPGRADE_CHANCE: Record<string, number> = {
  chest_common:    0.15,
  chest_rare:      0.40,
  chest_legendary: 0.80,
};

// Upgrade magnitudes per rarity
export const UPGRADE_MAG: Record<ItemRarity, { dmg: number; range: number; cooldown: number; defense: number }> = {
  common:    { dmg: 1,  range: 0.05, cooldown: -1,  defense: 1  },
  uncommon:  { dmg: 2,  range: 0.10, cooldown: -2,  defense: 2  },
  rare:      { dmg: 4,  range: 0.15, cooldown: -4,  defense: 4  },
  legendary: { dmg: 8,  range: 0.25, cooldown: -6,  defense: 8  },
};

// Which stats can be upgraded on weapons vs armor
export const WEAPON_UPGRADABLE_STATS: WeaponStat[] = ['dmg', 'range', 'cooldown'];
export const ARMOR_UPGRADABLE_STATS:  ArmorStat[]  = ['defense'];
