import { create } from 'zustand';
import type { Achievement } from '../types/achievement';
import { fetchMyAchievements } from '../services/achievement.service';

interface AchievementState {
  achievements: Achievement[];
  isLoading: boolean;
  setAchievements: (a: Achievement[]) => void;
  /** Add newly-earned achievements (dedup by key), newest first. */
  addAchievements: (a: Achievement[]) => void;
  fetchAchievements: () => Promise<void>;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  isLoading: false,
  setAchievements: (achievements) => set({ achievements }),
  addAchievements: (incoming) => {
    if (!incoming.length) return;
    const existing = get().achievements;
    const have = new Set(existing.map((a) => a.key));
    const fresh = incoming.filter((a) => !have.has(a.key));
    if (!fresh.length) return;
    set({ achievements: [...fresh, ...existing] });
  },
  fetchAchievements: async () => {
    set({ isLoading: true });
    try {
      set({ achievements: await fetchMyAchievements() });
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));
