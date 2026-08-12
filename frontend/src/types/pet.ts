export const Element = {
  FEUER: 'feuer',
  WASSER: 'wasser',
  WIND: 'wind',
  ERDE: 'erde',
  BLITZ: 'blitz',
  METALL: 'metall',
  LICHT: 'licht',
  SCHATTEN: 'schatten',
  CHAOS: 'chaos',
  KRISTALL: 'kristall',
  NATUR: 'natur',
  GEIST: 'geist',
  FEE: 'fee',
  EIS: 'eis',
  GIFT: 'gift',
  KOSMOS: 'kosmos',
} as const;

export type Element = (typeof Element)[keyof typeof Element];

export const PetStage = {
  EGG: 'egg',
  HATCHLING: 'hatchling',
  JUVENILE: 'juvenile',
  ADULT: 'adult',
  ANCIENT: 'ancient',
} as const;

export type PetStage = (typeof PetStage)[keyof typeof PetStage];

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type PetMood = 'happy' | 'content' | 'lonely' | 'sad';

export interface Pet {
  id: string;
  userId: string;
  /** null while still an unhatched mystery egg. */
  species: string | null;
  speciesName: string | null;
  rarity: Rarity | null;
  element: Element | null;
  elementName: string | null;
  name: string | null;
  xp: number;
  stage: PetStage;
  isActive: boolean;
  obtainedFrom: string;
  /** Markdown personality document, written when the pet hatches. */
  soul: string;
  perks: string[];
  hatchedAt: string | null;
  currentStreak: number;
  lastStreakDate: string | null;
  lastQuestCompletedAt: string | null;
  questsCompletedToday: number;
  lastQuestDate: string | null;
  createdAt: string;
}

export interface PetChatMessage {
  id: string;
  petId: string;
  role: 'user' | 'pet';
  content: string;
  createdAt: string;
}

export interface XpResult {
  xpAwarded: number;
  bonusBreakdown: {
    baseXp: number;
    firstOfDayBonus: number;
    streakMultiplier: number;
    streak: number;
    treasureMultiplier?: number;
  };
  pet: Pet;
}
