export interface Achievement {
  key: string;
  title: string;
  description: string;
  imageUrl: string | null;
  /** present on earned achievements (/achievements/mine) */
  earnedAt?: string;
  /** present on catalog entries (/achievements/catalog) */
  earned?: boolean;
}

/** How an emblem was earned — decides the wording in the emblem log. */
export type EmblemSource =
  | 'sidequest'
  | 'daily'
  | 'quest'
  | 'milestone'
  | 'signup';

/**
 * An earned emblem including its log: when it was awarded, from which side
 * quest, and where the user stood at the time.
 */
export interface Emblem extends Achievement {
  earnedAt: string;
  emoji: string;
  color: string;
  sourceKind: EmblemSource;
  sourceSideQuestId: string | null;
  questTitle: string;
  questCategory: string;
  lat: number | null;
  lng: number | null;
  placeLabel: string;
}
