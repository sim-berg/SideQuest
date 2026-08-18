/**
 * The Track domain — everything that bundles several quests under one roof,
 * tracks progress towards a finish line, and pays out XP plus an emblem.
 *
 * Challenge, StoryArc and Event are the three shapes of the same idea, so they
 * share one base (see track.schema.ts, which models the inheritance with
 * Mongoose discriminators) and differ only in how their objectives are ordered
 * and unlocked:
 *
 *   Challenge — objectives run in parallel, self-paced, streak-driven
 *               ("Rauchfrei werden", "Ausbildungsplatz finden")
 *   StoryArc  — objectives run in sequence, each unlocking the next chapter
 *   Event     — objectives are bound to a time window and a place
 */
export const TrackKind = {
  CHALLENGE: 'challenge',
  STORY_ARC: 'story_arc',
  EVENT: 'event',
} as const;

export type TrackKind = (typeof TrackKind)[keyof typeof TrackKind];

/**
 * How an objective turns raw progress events into "done".
 *
 * Every objective listens on exactly one metric and compares the aggregate
 * against `target`; the kind decides *which* aggregate.
 */
export const ObjectiveKind = {
  /** Do it once. Target is always 1. ("Erstes Bewerbungsgespräch") */
  SINGLE: 'single',
  /** Cumulative count over the whole track. ("10 Bewerbungen abschicken") */
  TALLY: 'tally',
  /** N consecutive days. Broken by `resetOn`. ("30 Tage rauchfrei") */
  STREAK: 'streak',
  /** N distinct days, gaps allowed. ("An 20 Tagen in der Schule") */
  UNIQUE_DAYS: 'unique_days',
  /** Sum of a continuous value. ("50 km zurücklegen") */
  THRESHOLD: 'threshold',
  /**
   * Highest single value ever recorded — not a sum. ("eine Route über 10 km")
   * Distinct from THRESHOLD so a track can ask for both a season total and one
   * big effort on the same metric without the two feeding each other.
   */
  PEAK: 'peak',
} as const;

export type ObjectiveKind = (typeof ObjectiveKind)[keyof typeof ObjectiveKind];

/**
 * The measurable signals a track can listen on.
 *
 * A metric is the join between an objective and the rest of the app: finishing
 * a jog emits `run_km` + `quest_completed`, and every enrolled track that cares
 * about either advances. That is what lets one jog count towards the smoking
 * challenge *and* a route streak *and* stand alone as its own quest.
 */
export const Metric = {
  // --- Quest system ---
  /** Any quest completed. meta.category carries the quest category. */
  QUEST_COMPLETED: 'quest_completed',
  /** A specific quest template completed. meta.templateId identifies it. */
  QUEST_TEMPLATE_COMPLETED: 'quest_template_completed',
  /** All of today's daily side quests cleared. */
  DAILY_BOARD_CLEARED: 'daily_board_cleared',

  // --- Movement (sensor-fed) ---
  /** Kilometres travelled on a recorded route. value = km. */
  ROUTE_DISTANCE_KM: 'route_distance_km',
  /** A route finished, regardless of length. */
  ROUTE_COMPLETED: 'route_completed',
  /** Minutes of recorded activity. value = minutes. */
  ACTIVE_MINUTES: 'active_minutes',
  /** GPS presence confirmed at a place. meta.placeId identifies it. */
  PLACE_CHECKIN: 'place_checkin',

  // --- Habit / abstinence ---
  /** A day survived without smoking. Emitted by the daily check-in. */
  SMOKE_FREE_DAY: 'smoke_free_day',
  /** Relapse. Resets abstinence streaks — never a target itself. */
  SMOKED: 'smoked',
  /** A day without alcohol. */
  ALCOHOL_FREE_DAY: 'alcohol_free_day',
  /** A day under the self-set screen-time limit. */
  SCREEN_LIMIT_KEPT: 'screen_limit_kept',
  /** A day without ordering food / buying takeaway. */
  NO_SPEND_DAY: 'no_spend_day',

  // --- Education / career ---
  /** A job or apprenticeship application sent. */
  JOB_APPLICATION: 'job_application',
  /** An interview attended — the high-value milestone. */
  JOB_INTERVIEW: 'job_interview',
  /** A signed contract. Ends the apprenticeship challenge. */
  JOB_OFFER: 'job_offer',
  /** A day attended at school. */
  SCHOOL_ATTENDANCE: 'school_attendance',
  /** A completed study/homework session. value = minutes. */
  STUDY_MINUTES: 'study_minutes',

  // --- Everyday / self-care ---
  /** A tidy-up, chore or household task done. */
  CHORE_DONE: 'chore_done',
  /** A self-cooked meal. */
  MEAL_COOKED: 'meal_cooked',
  /** A day with the target amount of water. */
  HYDRATION_DAY: 'hydration_day',
  /** A night with the target sleep window kept. */
  SLEEP_ON_TIME: 'sleep_on_time',
  /** Pages read. value = pages. */
  PAGES_READ: 'pages_read',
  /** A creative artefact produced (photo, drawing, track, clip). */
  CREATION_MADE: 'creation_made',
  /** A meaningful social contact made. */
  SOCIAL_CONTACT: 'social_contact',
  /** Money put aside. value = euros. */
  MONEY_SAVED: 'money_saved',
  /** A cold shower survived. */
  COLD_SHOWER: 'cold_shower',
  /** An early rise before the target hour. */
  EARLY_RISE: 'early_rise',
  /** A workout session. */
  WORKOUT: 'workout',
  /** A meditation / breathing session. value = minutes. */
  MINDFUL_MINUTES: 'mindful_minutes',
  /** Litter collected on a walk. value = pieces. */
  LITTER_COLLECTED: 'litter_collected',
} as const;

export type Metric = (typeof Metric)[keyof typeof Metric];

/** Where a progress event came from — drives trust and undo rules. */
export const ProgressSource = {
  /** User tapped "erledigt". Reversible. */
  SELF_REPORT: 'self_report',
  /** Derived from a completed quest. */
  QUEST: 'quest',
  /** Derived from recorded GPS. Not reversible by hand. */
  SENSOR: 'sensor',
  /** Scanned a QR code on site. */
  QR: 'qr',
  /** Awarded by the system (migrations, admin fixes). */
  SYSTEM: 'system',
} as const;

export type ProgressSource =
  (typeof ProgressSource)[keyof typeof ProgressSource];

/** Lifecycle of one user's run at one track. */
export const EnrollmentStatus = {
  /** Visible in the pool, not yet accepted. */
  OFFERED: 'offered',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  /** User gave up. Progress is kept, so it can be resumed. */
  ABANDONED: 'abandoned',
  /** Deadline passed before completion. */
  EXPIRED: 'expired',
} as const;

export type EnrollmentStatus =
  (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

/**
 * Conditions a bonus rule can test. Kept as data (not code) so the catalog
 * stays declarative and new bonuses need no service changes.
 */
export const BonusTrigger = {
  /** Objective finished before a given hour of day. */
  BEFORE_HOUR: 'before_hour',
  /** Objective finished after a given hour of day. */
  AFTER_HOUR: 'after_hour',
  /** Finished on a Saturday or Sunday. */
  WEEKEND: 'weekend',
  /** Current streak at or above a length. */
  STREAK_AT_LEAST: 'streak_at_least',
  /** Track finished with every optional objective also done. */
  PERFECT_RUN: 'perfect_run',
  /** Track finished with days to spare before the deadline. */
  AHEAD_OF_SCHEDULE: 'ahead_of_schedule',
  /** A single progress event exceeded a value (e.g. a 10 km run). */
  VALUE_AT_LEAST: 'value_at_least',
  /** Weather/temperature recorded below a threshold. meta.tempC required. */
  COLD_WEATHER: 'cold_weather',
  /** Finished together with another user nearby. */
  WITH_COMPANION: 'with_companion',
} as const;

export type BonusTrigger = (typeof BonusTrigger)[keyof typeof BonusTrigger];
