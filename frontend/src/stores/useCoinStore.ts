import { create } from 'zustand';
import type { Wallet } from '../types/coin';
import { fetchMyWallet } from '../services/coin.service';

interface CoinState {
  wallet: Wallet | null;
  isLoading: boolean;
  fetchWallet: () => Promise<void>;
  /** Optimistic local adjust (e.g. right after a reward toast). */
  addCoins: (delta: number) => void;
  clearWallet: () => void;
}

export const useCoinStore = create<CoinState>((set, get) => ({
  wallet: null,
  isLoading: false,
  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const wallet = await fetchMyWallet();
      set({ wallet, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  addCoins: (delta) => {
    const wallet = get().wallet;
    if (wallet) set({ wallet: { ...wallet, balance: wallet.balance + delta } });
  },
  clearWallet: () => set({ wallet: null }),
}));
