import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EnrollmentStatus } from '../enums/track.enums.js';

/**
 * A user's running total for one objective.
 *
 * `current` means different things per objective kind, which is exactly why
 * the kind lives on the objective and not here: TALLY counts events, STREAK
 * counts consecutive days, THRESHOLD sums values. ProgressService owns the
 * interpretation; this schema just stores it.
 */
export interface ObjectiveProgress {
  objectiveId: string;
  /** Aggregate matching the objective's kind. */
  current: number;
  /** Best value ever reached — survives a streak reset, for "Rekord: 12 Tage". */
  best: number;
  /**
   * Day key (YYYY-MM-DD, local) of the last counted day. Guards STREAK and
   * UNIQUE_DAYS against double-counting one day.
   */
  lastDayKey: string | null;
  /** Distinct day keys counted, for UNIQUE_DAYS. */
  countedDays: string[];
  done: boolean;
  doneAt: Date | null;
  /** XP already paid for this objective — makes payouts idempotent. */
  xpPaid: number;
}

export type EnrollmentDocument = HydratedDocument<Enrollment>;

/**
 * One user's run at one track — the join row between a catalog Track and a
 * user, and the only place mutable progress lives.
 */
@Schema({ timestamps: true, collection: 'track_enrollments' })
export class Enrollment {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  trackId: string;

  /** Denormalised so the client can render a list without a second lookup. */
  @Prop({ required: true, index: true })
  trackSlug: string;

  @Prop({ default: EnrollmentStatus.ACTIVE, enum: EnrollmentStatus, index: true })
  status: EnrollmentStatus;

  @Prop({ type: [Object], default: [] })
  objectives: ObjectiveProgress[];

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  /** acceptedAt + track.durationDays; null for open-ended tracks. */
  @Prop({ type: Date, default: null })
  deadline: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  /** Chapter the user is on (StoryArc only). */
  @Prop({ default: 0 })
  currentStep: number;

  /** XP from objectives, excluding bonuses. */
  @Prop({ default: 0 })
  baseXpEarned: number;

  /** XP from bonus rules. */
  @Prop({ default: 0 })
  bonusXpEarned: number;

  /** Relapse count — shown as "3 Rückfälle, trotzdem weitergemacht". */
  @Prop({ default: 0 })
  relapses: number;

  /**
   * User-chosen substitutes for swappable objectives (objectiveId → questId).
   * Empty for tracks run as authored.
   */
  @Prop({ type: Object, default: {} })
  substitutions: Record<string, string>;

  createdAt: Date;
  updatedAt: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// One run per user per track.
EnrollmentSchema.index({ userId: 1, trackId: 1 }, { unique: true });
