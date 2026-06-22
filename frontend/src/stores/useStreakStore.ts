import { create } from 'zustand';

interface StreakState {
  show: boolean;
  streak: number;
  totalXp: number;
  questsCompleted: number;
  showStreakModal: (data: { streak: number; totalXp: number; questsCompleted: number }) => void;
  dismiss: () => void;
}

export const useStreakStore = create<StreakState>((set) => ({
  show: false,
  streak: 0,
  totalXp: 0,
  questsCompleted: 0,
  showStreakModal: ({ streak, totalXp, questsCompleted }) =>
    set({ show: true, streak, totalXp, questsCompleted }),
  dismiss: () => set({ show: false }),
}));
