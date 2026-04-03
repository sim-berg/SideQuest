import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InventoryWeapon, InventoryArmor, InventoryEffect, StatUpgrade } from '../types/inventory';

interface InventoryState {
  weapons: InventoryWeapon[];
  armor:   InventoryArmor[];
  effects: InventoryEffect[];

  addWeapon:    (weapon: InventoryWeapon) => void;
  addArmor:     (armor: InventoryArmor) => void;
  addEffect:    (effect: InventoryEffect) => void;
  upgradeWeapon:(weaponId: string, upgrade: StatUpgrade) => void;
  upgradeArmor: (armorId:  string, upgrade: StatUpgrade) => void;
  applyEffect:  (targetType: 'weapon' | 'armor', targetId: string, effectId: string) => void;
  removeEffect: (targetType: 'weapon' | 'armor', targetId: string, effectId: string) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      weapons: [],
      armor:   [],
      effects: [],

      addWeapon: (weapon) =>
        set((s) => ({ weapons: [...s.weapons, weapon] })),

      addArmor: (armor) =>
        set((s) => ({ armor: [...s.armor, armor] })),

      addEffect: (effect) =>
        set((s) => ({ effects: [...s.effects, effect] })),

      upgradeWeapon: (weaponId, upgrade) =>
        set((s) => ({
          weapons: s.weapons.map((w) =>
            w.id === weaponId ? { ...w, upgrades: [...w.upgrades, upgrade] } : w,
          ),
        })),

      upgradeArmor: (armorId, upgrade) =>
        set((s) => ({
          armor: s.armor.map((a) =>
            a.id === armorId ? { ...a, upgrades: [...a.upgrades, upgrade] } : a,
          ),
        })),

      applyEffect: (targetType, targetId, effectId) =>
        set((s) =>
          targetType === 'weapon'
            ? {
                weapons: s.weapons.map((w) =>
                  w.id === targetId && !w.appliedEffects.includes(effectId)
                    ? { ...w, appliedEffects: [...w.appliedEffects, effectId] }
                    : w,
                ),
              }
            : {
                armor: s.armor.map((a) =>
                  a.id === targetId && !a.appliedEffects.includes(effectId)
                    ? { ...a, appliedEffects: [...a.appliedEffects, effectId] }
                    : a,
                ),
              },
        ),

      removeEffect: (targetType, targetId, effectId) =>
        set((s) =>
          targetType === 'weapon'
            ? {
                weapons: s.weapons.map((w) =>
                  w.id === targetId
                    ? { ...w, appliedEffects: w.appliedEffects.filter((e) => e !== effectId) }
                    : w,
                ),
              }
            : {
                armor: s.armor.map((a) =>
                  a.id === targetId
                    ? { ...a, appliedEffects: a.appliedEffects.filter((e) => e !== effectId) }
                    : a,
                ),
              },
        ),
    }),
    { name: 'sidequest-inventory' },
  ),
);
