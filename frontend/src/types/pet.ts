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
  /** Generated portrait per evolution stage (stage → URL). */
  images: Record<string, string>;
  /** Portrait of the current stage, if already generated. */
  imageUrl: string | null;
  /** Soul growth: completed quests per category this pet lived through. */
  soulXp: Record<string, number>;
  /** Category the soul leans towards (most-lived quest type). */
  soulAlignment: string | null;
  /** Equipped treasure item ids (max 3). */
  equipment: string[];
  /** Free-form expansion bag for future features. */
  attributes: Record<string, unknown>;
  hatchedAt: string | null;
  currentStreak: number;
  lastStreakDate: string | null;
  lastQuestCompletedAt: string | null;
  questsCompletedToday: number;
  lastQuestDate: string | null;
  createdAt: string;
}

export type PetTradeStatus = 'open' | 'accepted' | 'declined' | 'cancelled';

/** A directed trade offer: this pet for `price` coins (0 = gift). */
export interface PetTrade {
  id: string;
  pet: Pet | null;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  price: number;
  status: PetTradeStatus;
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
