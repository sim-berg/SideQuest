import { create } from 'zustand';
import type { Quest } from '../types/quest';

interface SideQuestState {
  sideQuests: Quest[];
  /** the side quest shown in the Google-Maps-style modal (null = closed). */
  selected: Quest | null;
  /** ids we've already shown a spawn animation for (avoid re-popping). */
  seenIds: Set<string>;
  setSideQuests: (quests: Quest[]) => void;
  setSelected: (quest: Quest | null) => void;
  updateSideQuestInList: (quest: Quest) => void;
  removeSideQuest: (id: string) => void;
  markSeen: (ids: string[]) => void;
}

export const useSideQuestStore = create<SideQuestState>((set, get) => ({
  sideQuests: [],
  selected: null,
  seenIds: new Set<string>(),
  setSideQuests: (sideQuests) => set({ sideQuests }),
  setSelected: (selected) => set({ selected }),
  updateSideQuestInList: (quest) => {
    const exists = get().sideQuests.some((q) => q.id === quest.id);
    const sideQuests = exists
      ? get().sideQuests.map((q) => (q.id === quest.id ? quest : q))
      : [...get().sideQuests, quest];
    const selected =
      get().selected?.id === quest.id ? quest : get().selected;
    set({ sideQuests, selected });
  },
  removeSideQuest: (id) =>
    set({
      sideQuests: get().sideQuests.filter((q) => q.id !== id),
      selected: get().selected?.id === id ? null : get().selected,
    }),
  markSeen: (ids) => {
    const seenIds = new Set(get().seenIds);
    ids.forEach((id) => seenIds.add(id));
    set({ seenIds });
  },
}));
