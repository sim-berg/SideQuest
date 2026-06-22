import { create } from 'zustand';
import type { XpResult, EvolutionStage } from '../types/dragon';

export type CelebrationType =
  | 'accept'
  | 'complete'
  | 'evolution'
  | 'achievement';

export interface Celebration {
  id: number;
  type: CelebrationType;
  /** Headline / quest title for accept + complete; achievement title. */
  title?: string;
  /** XP payload for complete celebrations. */
  xpResult?: XpResult;
  /** Evolution payload. */
  fromStage?: EvolutionStage;
  toStage?: EvolutionStage;
  /** Achievement payload. */
  description?: string;
  imageUrl?: string | null;
}

interface CelebrationState {
  queue: Celebration[];
  celebrate: (c: Omit<Celebration, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  queue: [],
  celebrate: (c) => set({ queue: [...get().queue, { ...c, id: nextId++ }] }),
  dismiss: (id) => set({ queue: get().queue.filter((c) => c.id !== id) }),
}));
