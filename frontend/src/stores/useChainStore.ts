import { create } from 'zustand';
import type { QuestChain } from '../types/chain';
import { fetchCurrentChain, requestChainOffer } from '../services/chain.service';

interface ChainState {
  chain: QuestChain | null;
  /** Full-screen journey sheet visibility. */
  sheetOpen: boolean;
  /** Only ask the pet for an offer once per app session. */
  offerRequested: boolean;
  setChain: (chain: QuestChain | null) => void;
  openSheet: () => void;
  closeSheet: () => void;
  /** Load the running journey and, lacking one, request a fresh offer. */
  loadChain: (lat: number, lng: number) => Promise<void>;
}

export const useChainStore = create<ChainState>((set, get) => ({
  chain: null,
  sheetOpen: false,
  offerRequested: false,
  setChain: (chain) => set({ chain }),
  openSheet: () => set({ sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),
  loadChain: async (lat, lng) => {
    if (get().offerRequested) return;
    set({ offerRequested: true });
    try {
      const current = await fetchCurrentChain();
      if (current) {
        set({ chain: current });
        return;
      }
      const offered = await requestChainOffer(lat, lng);
      if (offered) set({ chain: offered });
    } catch {
      /* stay quiet — the pet simply has no journey today */
    }
  },
}));
