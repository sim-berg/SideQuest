export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type EffectType = 'glow' | 'particle' | 'trail' | 'aura' | 'enchant';

export type ItemSource = 'chest_common' | 'chest_rare' | 'chest_legendary' | 'level_up' | 'quest';

export type WeaponStat = 'dmg' | 'range' | 'cooldown';
export type ArmorStat  = 'defense';

export interface StatUpgrade {
  stat: WeaponStat | ArmorStat;
  value: number;      // positive = buff; negative cooldown = faster attack
  source: ItemSource;
  obtainedAt: string;
}

export interface InventoryWeapon {
  id: string;
  templateId: string; // matches WeaponClass: 'sword' | 'dagger' | 'spear' | 'staff'
  name: string;
  description: string;
  rarity: ItemRarity;
  obtainedAt: string;
  source: ItemSource;
  appliedEffects: string[]; // InventoryEffect IDs
  upgrades: StatUpgrade[];
}

export interface InventoryArmor {
  id: string;
  templateId: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  baseDefense: number;
  obtainedAt: string;
  source: ItemSource;
  appliedEffects: string[]; // InventoryEffect IDs
  upgrades: StatUpgrade[];
}

export interface InventoryEffect {
  id: string;
  templateId: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  effectType: EffectType;
  color?: string;
  obtainedAt: string;
  source: ItemSource;
}
