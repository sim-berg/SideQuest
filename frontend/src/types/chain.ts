import type { Pet, XpResult } from './pet';

export interface ChainStep {
  index: number;
  title: string;
  /** null while the step is still a mystery (not yet revealed). */
  clue: string | null;
  lat: number | null;
  lng: number | null;
  completed: boolean;
  completedAt: string | null;
}

export type ChainStatus = 'offered' | 'active' | 'completed' | 'expired';

export interface ChainPerk {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

/** A pet-offered detective journey across GPS waypoints. */
export interface QuestChain {
  id: string;
  storyId: string;
  title: string;
  intro: string;
  status: ChainStatus;
  steps: ChainStep[];
  /** Index of the step to walk to next (null when the journey is done). */
  currentStep: number | null;
  conclusion: string | null;
  perk: ChainPerk | null;
  expiresAt: string;
}

export interface ChainStepResult {
  chain: QuestChain;
  finished: boolean;
  xpResult: XpResult | null;
  perk: ChainPerk | null;
  egg: Pet | null;
}
