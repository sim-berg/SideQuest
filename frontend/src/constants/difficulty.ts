export const Difficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

interface DifficultyMeta {
  label: string;
  color: string;
  xp: number;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  easy: { label: 'Leicht', color: '#22c55e', xp: 25 },
  medium: { label: 'Mittel', color: '#eab308', xp: 50 },
  hard: { label: 'Schwer', color: '#ef4444', xp: 100 },
};
