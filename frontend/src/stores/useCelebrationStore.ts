import { create } from 'zustand';
import type { XpResult, PetStage, Pet } from '../types/pet';

export type CelebrationType =
  | 'accept'
  | 'complete'
  | 'evolution'
  | 'achievement'
  | 'hatch';

export interface Celebration {
  id: number;
  type: CelebrationType;
  /** Headline / quest title for accept + complete; achievement title. */
  title?: string;
  /** XP payload for complete celebrations. */
  xpResult?: XpResult;
  /** Evolution payload. */
  fromStage?: PetStage;
  toStage?: PetStage;
  /** Achievement payload. */
  description?: string;
  imageUrl?: string | null;
  /** Freshly hatched pet. */
  pet?: Pet;
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
