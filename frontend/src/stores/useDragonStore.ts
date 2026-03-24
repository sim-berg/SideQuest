import { create } from 'zustand';
import type { Dragon } from '../types/dragon';
import { fetchMyDragon } from '../services/dragon.service';

interface DragonState {
  dragon: Dragon | null;
  isLoading: boolean;
  setDragon: (dragon: Dragon | null) => void;
  fetchDragon: () => Promise<void>;
  clearDragon: () => void;
}

export const useDragonStore = create<DragonState>((set) => ({
  dragon: null,
  isLoading: false,
  setDragon: (dragon) => set({ dragon }),
  fetchDragon: async () => {
    set({ isLoading: true });
    try {
      const dragon = await fetchMyDragon();
      set({ dragon });
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },
  clearDragon: () => set({ dragon: null }),
}));
