import { create } from 'zustand';
import type {
  CraftingRecipeView,
  Inventory,
  InventoryEntry,
  TreasureSpawn,
} from '../types/treasure';
import { fetchInventory, fetchRecipes } from '../services/treasure.service';

interface TreasureState {
  /** Active chests on the map. */
  spawns: TreasureSpawn[];
  /** Chest ids that already played their spawn animation. */
  seenIds: Set<string>;
  /** Chest shown in the floating collect card (null = none). */
  selected: TreasureSpawn | null;
  /** Schatzkammer overlay open? */
  treasuryOpen: boolean;
  inventory: Inventory | null;
  recipes: CraftingRecipeView[];
  setSpawns: (spawns: TreasureSpawn[]) => void;
  markSeen: (ids: string[]) => void;
  setSelected: (spawn: TreasureSpawn | null) => void;
  removeSpawn: (id: string) => void;
  openTreasury: () => void;
  closeTreasury: () => void;
  fetchInventory: () => Promise<void>;
  fetchRecipes: () => Promise<void>;
  applyCollectedEntry: (entry: InventoryEntry) => void;
}

export const useTreasureStore = create<TreasureState>((set, get) => ({
  spawns: [],
  seenIds: new Set<string>(),
  selected: null,
  treasuryOpen: false,
  inventory: null,
  recipes: [],
  setSpawns: (spawns) => set({ spawns }),
  markSeen: (ids) => {
    const seenIds = new Set(get().seenIds);
    ids.forEach((id) => seenIds.add(id));
    set({ seenIds });
  },
  setSelected: (selected) => set({ selected }),
  removeSpawn: (id) => {
    const wasSelected = get().selected?.id === id;
    set({
      spawns: get().spawns.filter((s) => s.id !== id),
      selected: wasSelected ? null : get().selected,
    });
  },
  openTreasury: () => {
    set({ treasuryOpen: true });
    void get().fetchInventory();
    void get().fetchRecipes();
  },
  closeTreasury: () => set({ treasuryOpen: false }),
  fetchInventory: async () => {
    try {
      set({ inventory: await fetchInventory() });
    } catch {
      // not authenticated / offline — keep last known inventory
    }
  },
  fetchRecipes: async () => {
    try {
      set({ recipes: await fetchRecipes() });
    } catch {
      // ignore
    }
  },
  applyCollectedEntry: (entry) => {
    const inventory = get().inventory;
    if (!inventory) return;
    const exists = inventory.items.some((i) => i.itemId === entry.itemId);
    set({
      inventory: {
        ...inventory,
        items: exists
          ? inventory.items.map((i) =>
              i.itemId === entry.itemId ? entry : i,
            )
          : [...inventory.items, entry],
      },
    });
  },
}));
