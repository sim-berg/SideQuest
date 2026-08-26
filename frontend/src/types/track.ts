import type { Category, Difficulty } from './quest';

/**
 * Tracks — everything that bundles several quests, tracks progress and pays
 * out XP plus an emblem. Challenge, StoryArc and Event are the three shapes of
 * one idea and share this base; see the backend's track.schema.ts for the
 * matching inheritance.
 */
export const TrackKind = {
  CHALLENGE: 'challenge',
  STORY_ARC: 'story_arc',
  EVENT: 'event',
} as const;

export type TrackKind = (typeof TrackKind)[keyof typeof TrackKind];

/** How an objective turns raw events into "done". */
export const ObjectiveKind = {
  SINGLE: 'single',
  TALLY: 'tally',
  STREAK: 'streak',
  UNIQUE_DAYS: 'unique_days',
  THRESHOLD: 'threshold',
  PEAK: 'peak',
} as const;

export type ObjectiveKind = (typeof ObjectiveKind)[keyof typeof ObjectiveKind];

/**
 * The measurable signals a track listens on. Reporting one of these is how the
 * app feeds progress — never by naming a track, so a single jog can advance
 * several challenges at once.
 */
export const Metric = {
  QUEST_COMPLETED: 'quest_completed',
  QUEST_TEMPLATE_COMPLETED: 'quest_template_completed',
  DAILY_BOARD_CLEARED: 'daily_board_cleared',
  ROUTE_DISTANCE_KM: 'route_distance_km',
  ROUTE_COMPLETED: 'route_completed',
  ACTIVE_MINUTES: 'active_minutes',
  PLACE_CHECKIN: 'place_checkin',
  SMOKE_FREE_DAY: 'smoke_free_day',
  SMOKED: 'smoked',
  ALCOHOL_FREE_DAY: 'alcohol_free_day',
  SCREEN_LIMIT_KEPT: 'screen_limit_kept',
  NO_SPEND_DAY: 'no_spend_day',
  JOB_APPLICATION: 'job_application',
  JOB_INTERVIEW: 'job_interview',
  JOB_OFFER: 'job_offer',
  SCHOOL_ATTENDANCE: 'school_attendance',
  STUDY_MINUTES: 'study_minutes',
  CHORE_DONE: 'chore_done',
  MEAL_COOKED: 'meal_cooked',
  HYDRATION_DAY: 'hydration_day',
  SLEEP_ON_TIME: 'sleep_on_time',
  PAGES_READ: 'pages_read',
  CREATION_MADE: 'creation_made',
  SOCIAL_CONTACT: 'social_contact',
  MONEY_SAVED: 'money_saved',
  COLD_SHOWER: 'cold_shower',
  EARLY_RISE: 'early_rise',
  WORKOUT: 'workout',
  MINDFUL_MINUTES: 'mindful_minutes',
  LITTER_COLLECTED: 'litter_collected',
} as const;

export type Metric = (typeof Metric)[keyof typeof Metric];

export const ProgressSource = {
  SELF_REPORT: 'self_report',
  QUEST: 'quest',
  SENSOR: 'sensor',
  QR: 'qr',
  SYSTEM: 'system',
} as const;

export type ProgressSource =
  (typeof ProgressSource)[keyof typeof ProgressSource];

export type EnrollmentStatus =
  | 'offered'
  | 'active'
  | 'completed'
  | 'abandoned'
  | 'expired';

/** One goal inside a track, with this user's progress already folded in. */
export interface ObjectiveView {
  id: string;
  title: string;
  description: string;
  emoji: string;
  kind: ObjectiveKind;
  metric: Metric;
  target: number;
  current: number;
  /** What is still missing — the number the UI leads with. */
  remaining: number;
  /** 0–1, for the progress bar. */
  ratio: number;
  /** Best value ever reached; survives a streak reset. */
  best: number;
  done: boolean;
  doneAt: string | null;
  /** Not required to finish the track, but pays XP and counts for bonuses. */
  optional: boolean;
  /** Story arc: still in a future chapter. */
  locked: boolean;
  xpReward: number;
  unlocksAtStep: number | null;
  /** Ready-made sentence: "noch 12 Tage am Stück (aktuell 3)". */
  remainingLabel: string;
}

export interface ArcChapter {
  step: number;
  title: string;
  intro: string;
  outro: string;
}

/** A track plus, when accepted, the user's run at it. */
export interface Track {
  id: string;
  kind: TrackKind;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  emoji: string;
  color: string;
  category: Category;
  difficulty: Difficulty;
  tags: string[];
  completionXp: number;
  completionCoins: number;
  emblemKey: string | null;
  durationDays: number | null;
  objectives: ObjectiveView[];
  bonusRules: { id: string; label: string }[];
  // Enrollment state
  enrolled: boolean;
  status: EnrollmentStatus | null;
  acceptedAt: string | null;
  deadline: string | null;
  daysLeft: number | null;
  completedAt: string | null;
  currentStep: number;
  relapses: number;
  xpEarned: number;
  /** Required objectives done / total. */
  doneCount: number;
  requiredCount: number;
  ratio: number;
  /** What still has to happen, ready to render. */
  missing: string[];
  // Kind-specific
  chapters?: ArcChapter[];
  conclusion?: string | null;
  relapseMetric?: Metric | null;
  relapseCopy?: string | null;
}

/** One objective that moved because of a reported event. */
export interface ObjectiveDelta {
  trackSlug: string;
  trackTitle: string;
  objectiveId: string;
  objectiveTitle: string;
  before: number;
  after: number;
  target: number;
  justCompleted: boolean;
  streakReset: boolean;
  xpAwarded: number;
  bonuses: { id: string; label: string; xp: number }[];
}

/** What reporting progress caused — enough to celebrate without a refetch. */
export interface ProgressResult {
  recorded: boolean;
  deltas: ObjectiveDelta[];
  completedTracks: {
    slug: string;
    title: string;
    emblemKey: string | null;
    xp: number;
    coins: number;
  }[];
  totalXp: number;
  rewards: {
    xpAwarded: number;
    coinsAwarded: number;
    emblems: { key: string; title: string; imageUrl: string | null }[];
  };
}

export interface ProgressHistoryEntry {
  metric: Metric;
  value: number;
  source: ProgressSource;
  dayKey: string;
  meta: Record<string, unknown>;
  occurredAt: string;
}
