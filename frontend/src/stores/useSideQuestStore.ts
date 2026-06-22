import { create } from 'zustand';
import type { Quest } from '../types/quest';

interface SideQuestState {
  sideQuests: Quest[];
  /** the side quest shown in the map card / detail screen (null = none). */
  selected: Quest | null;
  /** whether the full detail screen is open for `selected`. */
  detailOpen: boolean;
  /** ids we've already shown a spawn animation for (avoid re-popping). */
  seenIds: Set<string>;
  setSideQuests: (quests: Quest[]) => void;
  setSelected: (quest: Quest | null) => void;
  openDetail: () => void;
  closeDetail: () => void;
  updateSideQuestInList: (quest: Quest) => void;
  removeSideQuest: (id: string) => void;
  markSeen: (ids: string[]) => void;
}

export const useSideQuestStore = create<SideQuestState>((set, get) => ({
  sideQuests: [],
  selected: null,
  detailOpen: false,
  seenIds: new Set<string>(),
  setSideQuests: (sideQuests) => set({ sideQuests }),
  setSelected: (selected) => set({ selected, detailOpen: false }),
  openDetail: () => set({ detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  updateSideQuestInList: (quest) => {
    const exists = get().sideQuests.some((q) => q.id === quest.id);
    const sideQuests = exists
      ? get().sideQuests.map((q) => (q.id === quest.id ? quest : q))
      : [...get().sideQuests, quest];
    const selected =
      get().selected?.id === quest.id ? quest : get().selected;
    set({ sideQuests, selected });
  },
  removeSideQuest: (id) => {
    const wasSelected = get().selected?.id === id;
    set({
      sideQuests: get().sideQuests.filter((q) => q.id !== id),
      selected: wasSelected ? null : get().selected,
      detailOpen: wasSelected ? false : get().detailOpen,
    });
  },
  markSeen: (ids) => {
    const seenIds = new Set(get().seenIds);
    ids.forEach((id) => seenIds.add(id));
    set({ seenIds });
  },
}));
