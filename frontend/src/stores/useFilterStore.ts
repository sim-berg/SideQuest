import { create } from 'zustand';
import { Category } from '../types/quest';

interface FilterState {
  categories: Category[];
  distanceKm: number;
  paidOnly: boolean;
  timedOnly: boolean;
  toggleCategory: (cat: Category) => void;
  setDistance: (km: number) => void;
  togglePaidOnly: () => void;
  toggleTimedOnly: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  categories: Object.values(Category),
  distanceKm: 5,
  paidOnly: false,
  timedOnly: false,
  toggleCategory: (cat) =>
    set((s) => ({
      categories: s.categories.includes(cat)
        ? s.categories.filter((c) => c !== cat)
        : [...s.categories, cat],
    })),
  setDistance: (distanceKm) => set({ distanceKm }),
  togglePaidOnly: () => set((s) => ({ paidOnly: !s.paidOnly })),
  toggleTimedOnly: () => set((s) => ({ timedOnly: !s.timedOnly })),
}));
