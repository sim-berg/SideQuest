import { create } from 'zustand';
import type { ZoneType, RpgQuest, CompleteQuestResult } from '../types/rpg';
import { getRpgQuests, completeRpgQuest } from '../services/rpg.service';

interface ZoneUnlockState {
  checked: boolean;
  unlocked: boolean;
  checkedAt: number;
}

interface RpgState {
  activeZone: ZoneType | null;
  zoneUnlocks: Partial<Record<ZoneType, ZoneUnlockState>>;
  quests: RpgQuest[];
  questsLoading: boolean;
  lastCompletionResult: CompleteQuestResult | null;

  setActiveZone: (zone: ZoneType | null) => void;
  setZoneUnlock: (zone: ZoneType, unlocked: boolean) => void;
  fetchQuests: (zone: ZoneType) => Promise<void>;
  completeQuest: (templateId: string) => Promise<CompleteQuestResult>;
  clearLastResult: () => void;
}

export const useRpgStore = create<RpgState>((set, get) => ({
  activeZone: null,
  zoneUnlocks: {},
  quests: [],
  questsLoading: false,
  lastCompletionResult: null,

  setActiveZone: (activeZone) => {
    set({ activeZone, quests: [] });
  },

  setZoneUnlock: (zone, unlocked) =>
    set((s) => ({
      zoneUnlocks: {
        ...s.zoneUnlocks,
        [zone]: { checked: true, unlocked, checkedAt: Date.now() },
      },
    })),

  fetchQuests: async (zone) => {
    set({ questsLoading: true });
    try {
      const quests = await getRpgQuests(zone);
      set({ quests });
    } finally {
      set({ questsLoading: false });
    }
  },

  completeQuest: async (templateId) => {
    const result = await completeRpgQuest(templateId);
    // Refresh quest list
    const { activeZone, fetchQuests } = get();
    if (activeZone) await fetchQuests(activeZone);
    set({ lastCompletionResult: result });
    return result;
  },

  clearLastResult: () => set({ lastCompletionResult: null }),
}));
