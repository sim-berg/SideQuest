import { create } from 'zustand';
import type { Quest } from '../types/quest';

interface QuestState {
  quests: Quest[];
  selectedQuest: Quest | null;
  isLoading: boolean;
  setQuests: (quests: Quest[]) => void;
  selectQuest: (quest: Quest | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useQuestStore = create<QuestState>((set) => ({
  quests: [],
  selectedQuest: null,
  isLoading: false,
  setQuests: (quests) => set({ quests }),
  selectQuest: (selectedQuest) => set({ selectedQuest }),
  setLoading: (isLoading) => set({ isLoading }),
}));
