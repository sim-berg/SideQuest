import { create } from 'zustand';

interface LogbookState {
  open: boolean;
  openLogbook: () => void;
  closeLogbook: () => void;
}

export const useLogbookStore = create<LogbookState>((set) => ({
  open: false,
  openLogbook: () => set({ open: true }),
  closeLogbook: () => set({ open: false }),
}));
