import { create } from 'zustand';
import type { DailySideQuest } from '../types/sidequest';
import { fetchDailySideQuests } from '../services/sidequest.service';

interface DailySideQuestState {
  daily: DailySideQuest[];
  isLoading: boolean;
  setDaily: (d: DailySideQuest[]) => void;
  updateDaily: (d: DailySideQuest) => void;
  fetchDaily: () => Promise<void>;
}

export const useDailySideQuestStore = create<DailySideQuestState>((set, get) => ({
  daily: [],
  isLoading: false,
  setDaily: (daily) => set({ daily }),
  updateDaily: (d) =>
    set({ daily: get().daily.map((x) => (x.id === d.id ? d : x)) }),
  fetchDaily: async () => {
    set({ isLoading: true });
    try {
      set({ daily: await fetchDailySideQuests() });
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));
