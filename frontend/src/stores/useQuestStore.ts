import { create } from 'zustand';
import type { Quest } from '../types/quest';

interface QuestState {
  quests: Quest[];
  selectedQuest: Quest | null;
  /** whether the full detail screen is open for `selectedQuest`. */
  detailOpen: boolean;
  isLoading: boolean;
  activeQuest: Quest | null;
  isAccepting: boolean;
  isCompleting: boolean;
  setQuests: (quests: Quest[]) => void;
  selectQuest: (quest: Quest | null) => void;
  openDetail: () => void;
  closeDetail: () => void;
  setLoading: (loading: boolean) => void;
  setActiveQuest: (quest: Quest | null) => void;
  setAccepting: (v: boolean) => void;
  setCompleting: (v: boolean) => void;
  updateQuestInList: (quest: Quest) => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],
  selectedQuest: null,
  detailOpen: false,
  isLoading: false,
  activeQuest: null,
  isAccepting: false,
  isCompleting: false,
  setQuests: (quests) => set({ quests }),
  // Selecting a quest shows the peek card; it never auto-opens the full screen.
  selectQuest: (selectedQuest) => set({ selectedQuest, detailOpen: false }),
  openDetail: () => set({ detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
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
