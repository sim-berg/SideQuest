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
