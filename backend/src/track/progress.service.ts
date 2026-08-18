import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EnrollmentStatus,
  Metric,
  ObjectiveKind,
  ProgressSource,
  TrackKind,
} from './enums/track.enums.js';
import {
  Enrollment,
  EnrollmentDocument,
  ObjectiveProgress,
} from './schemas/enrollment.schema.js';
import { ProgressEvent, ProgressEventDocument } from './schemas/progress-event.schema.js';
import { Track, TrackDocument, Objective } from './schemas/track.schema.js';
import { BonusService, AppliedBonus } from './bonus.service.js';
import { daysBetween, previousDayKey, toDayKey } from './day-key.util.js';

/** What the caller hands in when something happened. */
export interface EmitInput {
  userId: string;
  metric: Metric;
  value?: number;
  source: ProgressSource;
  meta?: Record<string, unknown>;
  /** Stable key making a retry a no-op, e.g. `quest:<id>`. */
  dedupeKey?: string | null;
  occurredAt?: Date;
  /** Minutes the user's local time is behind UTC, for correct day keys. */
  tzOffsetMinutes?: number;
}

/** One objective that moved because of an event. */
export interface ObjectiveDelta {
  trackSlug: string;
  trackTitle: string;
  objectiveId: string;
  objectiveTitle: string;
  before: number;
  after: number;
  target: number;
  justCompleted: boolean;
  /** Streak was broken by a relapse event. */
  streakReset: boolean;
  xpAwarded: number;
  bonuses: AppliedBonus[];
}

/** Everything one emitted event caused. */
export interface EmitResult {
  /** false when the event was a duplicate and nothing was applied. */
  recorded: boolean;
  deltas: ObjectiveDelta[];
  /** Tracks finished by this event. */
  completedTracks: {
    slug: string;
    title: string;
    emblemKey: string | null;
    xp: number;
    coins: number;
  }[];
  totalXp: number;
}

/**
 * The progress engine.
 *
 * One rule governs the whole design: the rest of the app never knows which
 * tracks exist. Quests, routes, check-ins and the daily board all call
 * `emit()` with a metric, and this service fans that single fact out to every
 * enrollment listening on it. That is what makes one jog count towards the
 * smoking challenge, a route streak and its own quest simultaneously, without
 * any of those three knowing about the others.
 */
@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectModel(Track.name)
    private readonly trackModel: Model<TrackDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(ProgressEvent.name)
    private readonly eventModel: Model<ProgressEventDocument>,
    private readonly bonusService: BonusService,
  ) {}

  /**
   * Record that something happened and advance every track that cares.
   *
   * Safe to call from anywhere and safe to call twice with the same
   * `dedupeKey` — the second call returns `recorded: false` untouched.
   */
  async emit(input: EmitInput): Promise<EmitResult> {
    const occurredAt = input.occurredAt ?? new Date();
    const tz = input.tzOffsetMinutes ?? 0;
    const dayKey = toDayKey(occurredAt, tz);
    const value = input.value ?? 1;

    const empty: EmitResult = {
      recorded: false,
      deltas: [],
      completedTracks: [],
      totalXp: 0,
    };

    // Persist first: the event log is the source of truth and must survive
    // even if no track currently listens to this metric.
    try {
      await this.eventModel.create({
        userId: input.userId,
        metric: input.metric,
        value,
        source: input.source,
        dayKey,
        meta: input.meta ?? {},
        dedupeKey: input.dedupeKey ?? null,
        occurredAt,
      });
    } catch (err) {
      // Unique index on (userId, dedupeKey) — a retry of an already-counted
      // event. Swallowing this is what makes emit() idempotent.
      if ((err as { code?: number }).code === 11000) return empty;
      throw err;
    }

    const enrollments = await this.enrollmentModel
      .find({ userId: input.userId, status: EnrollmentStatus.ACTIVE })
      .exec();
    if (enrollments.length === 0) return { ...empty, recorded: true };

    const tracks = await this.trackModel
      .find({ _id: { $in: enrollments.map((e) => e.trackId) } })
      .exec();
    const trackById = new Map(tracks.map((t) => [String(t._id), t]));

    const result: EmitResult = {
      recorded: true,
      deltas: [],
      completedTracks: [],
      totalXp: 0,
    };

    for (const enrollment of enrollments) {
      const track = trackById.get(enrollment.trackId);
      if (!track) continue;

      const applied = await this.applyToEnrollment(
        enrollment,
        track,
        input.metric,
        value,
        dayKey,
        occurredAt,
        input.meta ?? {},
      );

      result.deltas.push(...applied.deltas);
      result.completedTracks.push(...applied.completedTracks);
      result.totalXp += applied.xp;
    }

    return result;
  }

  /**
   * Apply one event to one enrollment. Returns what moved.
   *
   * Everything is computed on the in-memory document and saved once, so a
   * single event never leaves an enrollment half-updated.
   */
  private async applyToEnrollment(
    enrollment: EnrollmentDocument,
    track: TrackDocument,
    metric: Metric,
    value: number,
    dayKey: string,
    occurredAt: Date,
    meta: Record<string, unknown>,
  ): Promise<{
    deltas: ObjectiveDelta[];
    completedTracks: EmitResult['completedTracks'];
    xp: number;
  }> {
    const deltas: ObjectiveDelta[] = [];
    let gainedXp = 0;
    let touched = false;
    // One relapse is one relapse, however many streaks it breaks — the
    // smoking challenge alone has three objectives listening on it.
    let relapsed = false;

    for (const objective of track.objectives) {
      const progress = this.progressFor(enrollment, objective.id);

      // --- Relapse: this metric breaks the objective's streak ---
      if (objective.resetOn === metric && objective.kind === ObjectiveKind.STREAK) {
        if (progress.current > 0 && !progress.done) {
          const before = progress.current;
          progress.current = 0;
          progress.lastDayKey = null;
          relapsed = true;
          touched = true;
          deltas.push({
            trackSlug: track.slug,
            trackTitle: track.title,
            objectiveId: objective.id,
            objectiveTitle: objective.title,
            before,
            after: 0,
            target: objective.target,
            justCompleted: false,
            streakReset: true,
            xpAwarded: 0,
            bonuses: [],
          });
        }
        continue;
      }

      if (objective.metric !== metric) continue;
      if (progress.done) continue;
      if (!this.isUnlocked(objective, enrollment, track)) continue;

      const before = progress.current;
      const advanced = this.advance(objective, progress, value, dayKey);
      if (!advanced) continue;

      touched = true;
      progress.best = Math.max(progress.best, progress.current);

      const justCompleted = progress.current >= objective.target;
      if (justCompleted) {
        progress.done = true;
        progress.doneAt = occurredAt;
      }

      // XP is only paid when the objective actually finishes — partial
      // progress is its own reward, and paying per step would make long
      // objectives strictly better than short ones.
      let xpAwarded = 0;
      let bonuses: AppliedBonus[] = [];
      if (justCompleted && progress.xpPaid === 0) {
        const willCompleteTrack = this.wouldCompleteTrack(enrollment, track);
        const { bonusXp, applied } = this.bonusService.apply(
          track.bonusRules,
          objective.xpReward,
          {
            eventValue: value,
            hour: occurredAt.getHours(),
            dayKey,
            streak: progress.current,
            meta,
            trackCompleted: willCompleteTrack,
            perfectRun: this.isPerfectRun(enrollment, track),
            daysEarly: enrollment.deadline
              ? daysBetween(dayKey, toDayKey(enrollment.deadline))
              : null,
          },
        );

        xpAwarded = objective.xpReward + bonusXp;
        bonuses = applied;
        progress.xpPaid = xpAwarded;
        enrollment.baseXpEarned += objective.xpReward;
        enrollment.bonusXpEarned += bonusXp;
        gainedXp += xpAwarded;
      }

      deltas.push({
        trackSlug: track.slug,
        trackTitle: track.title,
        objectiveId: objective.id,
        objectiveTitle: objective.title,
        before,
        after: progress.current,
        target: objective.target,
        justCompleted,
        streakReset: false,
        xpAwarded,
        bonuses,
      });
    }

    if (!touched) return { deltas: [], completedTracks: [], xp: 0 };

    if (relapsed) enrollment.relapses += 1;

    // Story arcs move to the next chapter once the current one is cleared.
    if (track.kind === TrackKind.STORY_ARC) {
      this.advanceChapter(enrollment, track);
    }

    const completedTracks: EmitResult['completedTracks'] = [];
    if (this.isTrackComplete(enrollment, track)) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = occurredAt;
      gainedXp += track.completionXp;
      completedTracks.push({
        slug: track.slug,
        title: track.title,
        emblemKey: track.emblemKey,
        xp: track.completionXp,
        coins: track.completionCoins,
      });
    }

    enrollment.markModified('objectives');
    await enrollment.save();

    return { deltas, completedTracks, xp: gainedXp };
  }

  /**
   * Move one objective forward. Returns false when the event does not count
   * (already counted today, wrong day, no gain).
   *
   * The aggregation rule per kind — and the one distinction worth remembering:
   * TALLY counts *events* (20 study sessions), THRESHOLD sums *values*
   * (600 study minutes). Both can listen on the same metric.
   */
  private advance(
    objective: Objective,
    progress: ObjectiveProgress,
    value: number,
    dayKey: string,
  ): boolean {
    switch (objective.kind) {
      case ObjectiveKind.SINGLE:
        if (value <= 0) return false;
        progress.current = 1;
        progress.lastDayKey = dayKey;
        return true;

      case ObjectiveKind.TALLY:
        progress.current += 1;
        progress.lastDayKey = dayKey;
        return true;

      case ObjectiveKind.THRESHOLD:
        if (value <= 0) return false;
        progress.current += value;
        progress.lastDayKey = dayKey;
        return true;

      case ObjectiveKind.PEAK:
        if (value <= progress.current) return false;
        progress.current = value;
        progress.lastDayKey = dayKey;
        return true;

      case ObjectiveKind.STREAK: {
        // One day can only extend a streak once, no matter how many events
        // land on it.
        if (progress.lastDayKey === dayKey) return false;
        const continues =
          progress.lastDayKey !== null &&
          progress.lastDayKey === previousDayKey(dayKey);
        progress.current = continues ? progress.current + 1 : 1;
        progress.lastDayKey = dayKey;
        return true;
      }

      case ObjectiveKind.UNIQUE_DAYS: {
        if (progress.countedDays.includes(dayKey)) return false;
        progress.countedDays.push(dayKey);
        progress.current = progress.countedDays.length;
        progress.lastDayKey = dayKey;
        return true;
      }

      default:
        return false;
    }
  }

  /** Story-arc objectives stay locked until their chapter is reached. */
  private isUnlocked(
    objective: Objective,
    enrollment: EnrollmentDocument,
    track: TrackDocument,
  ): boolean {
    if (track.kind !== TrackKind.STORY_ARC) return true;
    if (objective.unlocksAtStep === null) return true;
    return objective.unlocksAtStep <= enrollment.currentStep;
  }

  /** Advance the arc as far as the finished chapters allow. */
  private advanceChapter(
    enrollment: EnrollmentDocument,
    track: TrackDocument,
  ): void {
    let moved = true;
    while (moved) {
      moved = false;
      const current = track.objectives.filter(
        (o) => (o.unlocksAtStep ?? 0) === enrollment.currentStep && !o.optional,
      );
      if (current.length === 0) break;

      const allDone = current.every(
        (o) => this.progressFor(enrollment, o.id).done,
      );
      const hasNext = track.objectives.some(
        (o) => (o.unlocksAtStep ?? 0) > enrollment.currentStep,
      );
      if (allDone && hasNext) {
        enrollment.currentStep += 1;
        moved = true;
      }
    }
  }

  /** Every required objective done. */
  private isTrackComplete(
    enrollment: EnrollmentDocument,
    track: TrackDocument,
  ): boolean {
    const required = track.objectives.filter((o) => !o.optional);
    if (required.length === 0) return false;
    return required.every((o) => this.progressFor(enrollment, o.id).done);
  }

  /**
   * Would the track be complete if the objective currently being processed
   * also finished? Needed because bonus rules are evaluated before the
   * completion check runs.
   */
  private wouldCompleteTrack(
    enrollment: EnrollmentDocument,
    track: TrackDocument,
  ): boolean {
    const required = track.objectives.filter((o) => !o.optional);
    const open = required.filter(
      (o) => !this.progressFor(enrollment, o.id).done,
    );
    return open.length <= 1;
  }

  /** Optional objectives cleared too. */
  private isPerfectRun(
    enrollment: EnrollmentDocument,
    track: TrackDocument,
  ): boolean {
    const optional = track.objectives.filter((o) => o.optional);
    if (optional.length === 0) return true;
    return optional.every((o) => this.progressFor(enrollment, o.id).done);
  }

  /** Progress row for an objective, created lazily on first touch. */
  private progressFor(
    enrollment: EnrollmentDocument,
    objectiveId: string,
  ): ObjectiveProgress {
    let row = enrollment.objectives.find((p) => p.objectiveId === objectiveId);
    if (!row) {
      row = {
        objectiveId,
        current: 0,
        best: 0,
        lastDayKey: null,
        countedDays: [],
        done: false,
        doneAt: null,
        xpPaid: 0,
      };
      enrollment.objectives.push(row);
    }
    return row;
  }

  /** Raw event history, newest first — powers the progress detail view. */
  async history(
    userId: string,
    metric: Metric | null,
    limit = 50,
  ): Promise<ProgressEventDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (metric) filter.metric = metric;
    return this.eventModel
      .find(filter)
      .sort({ occurredAt: -1 })
      .limit(Math.min(limit, 200))
      .exec();
  }
}
