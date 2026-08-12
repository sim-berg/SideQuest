import { create } from 'zustand';
import type { DailyBoard, DailySideQuest } from '../types/sidequest';
import { fetchDailyBoard } from '../services/sidequest.service';

const EMPTY_BOARD: DailyBoard = {
  date: '',
  quests: [],
  completed: 0,
  total: 0,
  allDone: false,
  streak: 0,
  longestStreak: 0,
  secured: false,
};

interface DailySideQuestState {
  board: DailyBoard;
  isLoading: boolean;
  setBoard: (b: DailyBoard) => void;
  updateDaily: (d: DailySideQuest) => void;
  fetchDaily: () => Promise<void>;
}

export const useDailySideQuestStore = create<DailySideQuestState>((set, get) => ({
  board: EMPTY_BOARD,
  isLoading: false,
  setBoard: (board) => set({ board }),
  updateDaily: (d) => {
    const board = get().board;
    const quests = board.quests.map((x) => (x.id === d.id ? d : x));
    const completed = quests.filter((q) => q.completed).length;
    set({
      board: {
        ...board,
        quests,
        completed,
        allDone: quests.length > 0 && completed === quests.length,
      },
    });
  },
  fetchDaily: async () => {
    set({ isLoading: true });
    try {
      set({ board: await fetchDailyBoard() });
    } catch {
      // not authenticated / offline — keep the last known board
    } finally {
      set({ isLoading: false });
    }
  },
}));
