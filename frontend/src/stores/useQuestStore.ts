import { create } from 'zustand';
import type { Quest } from '../types/quest';

interface QuestState {
  quests: Quest[];
  selectedQuest: Quest | null;
  isLoading: boolean;
  activeQuest: Quest | null;
  isAccepting: boolean;
  isCompleting: boolean;
  setQuests: (quests: Quest[]) => void;
  selectQuest: (quest: Quest | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveQuest: (quest: Quest | null) => void;
  setAccepting: (v: boolean) => void;
  setCompleting: (v: boolean) => void;
  updateQuestInList: (quest: Quest) => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],
  selectedQuest: null,
  isLoading: false,
  activeQuest: null,
  isAccepting: false,
  isCompleting: false,
  setQuests: (quests) => set({ quests }),
  selectQuest: (selectedQuest) => set({ selectedQuest }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveQuest: (activeQuest) => set({ activeQuest }),
  setAccepting: (isAccepting) => set({ isAccepting }),
  setCompleting: (isCompleting) => set({ isCompleting }),
  updateQuestInList: (quest) => {
    const quests = get().quests.map((q) => (q.id === quest.id ? quest : q));
    const selectedQuest =
      get().selectedQuest?.id === quest.id ? quest : get().selectedQuest;
    set({ quests, selectedQuest });
  },
}));
