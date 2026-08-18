import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CHALLENGE_CATALOG } from './catalog/challenges.catalog.js';
import { STORY_ARC_CATALOG } from './catalog/story-arcs.catalog.js';
import {
  EnrollmentStatus,
  ObjectiveKind,
  TrackKind,
} from './enums/track.enums.js';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema.js';
import { Track, TrackDocument, Objective } from './schemas/track.schema.js';
import { daysBetween, toDayKey } from './day-key.util.js';

/** One objective as the client sees it: definition plus this user's progress. */
export interface ObjectiveView {
  id: string;
  title: string;
  description: string;
  emoji: string;
  kind: ObjectiveKind;
  metric: string;
  target: number;
  current: number;
  /** How much is still missing — the number the UI leads with. */
  remaining: number;
  /** 0–1, for the progress bar. */
  ratio: number;
  best: number;
  done: boolean;
  doneAt: string | null;
  optional: boolean;
  locked: boolean;
  xpReward: number;
  unlocksAtStep: number | null;
  /** Human summary of what is left ("noch 12 Tage am Stück"). */
  remainingLabel: string;
}

/** A track plus, when enrolled, the user's run at it. */
export interface TrackView {
  id: string;
  kind: TrackKind;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
  difficulty: string;
  tags: string[];
  completionXp: number;
  completionCoins: number;
  emblemKey: string | null;
  durationDays: number | null;
  objectives: ObjectiveView[];
  bonusRules: { id: string; label: string }[];
  // Enrollment-dependent
  enrolled: boolean;
  status: EnrollmentStatus | null;
  acceptedAt: string | null;
  deadline: string | null;
  daysLeft: number | null;
  completedAt: string | null;
  currentStep: number;
  relapses: number;
  xpEarned: number;
  /** Required objectives done / total — the headline progress. */
  doneCount: number;
  requiredCount: number;
  ratio: number;
  /** Ordered list of what still has to happen. */
  missing: string[];
  // Kind-specific extras
  chapters?: { step: number; title: string; intro: string; outro: string }[];
  conclusion?: string | null;
  relapseMetric?: string | null;
  relapseCopy?: string | null;
}

/**
 * Reads and writes tracks: seeds the catalog, serves the pool, accepts
 * enrollments and renders progress.
 *
 * Progress *mutation* deliberately lives in ProgressService instead — this
 * service never advances an objective, it only reports on one.
 */
@Injectable()
export class TrackService {
  private readonly logger = new Logger(TrackService.name);

  constructor(
    @InjectModel(Track.name)
    private readonly trackModel: Model<TrackDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  /**
   * Upsert the code-defined catalog into the database on boot.
   *
   * Catalog entries are authored in TypeScript (reviewable, diffable) and
   * mirrored into Mongo so enrollments can reference them by id and so an
   * admin can unpublish one without a deploy.
   */
  async seedCatalog(): Promise<number> {
    const defs = [...CHALLENGE_CATALOG, ...STORY_ARC_CATALOG];
    let count = 0;

    for (const def of defs) {
      const { kind, slug, ...rest } = def;

      // Seeded through the driver rather than the model, on purpose. Mongoose
      // strips the discriminator key from updates (it refuses to let a document
      // change type) and the base schema drops kind-specific fields like
      // `chapters` and `relapseMetric` — between them, a model-level upsert
      // would write a track with no kind and half its content missing.
      // Reads still go through the model and hydrate with the right
      // discriminator schema; the catalog's own types are the validation here.
      await this.trackModel.collection.updateOne(
        { slug },
        {
          $set: { ...rest, kind, slug, published: true, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      count += 1;
    }

    this.logger.log(`Track catalog seeded: ${count} entries`);
    return count;
  }

  /** The pool: every published track, with this user's progress folded in. */
  async findPool(
    userId: string | null,
    opts: { kind?: TrackKind; tag?: string } = {},
  ): Promise<TrackView[]> {
    const filter: Record<string, unknown> = { published: true };
    if (opts.kind) filter.kind = opts.kind;
    if (opts.tag) filter.tags = opts.tag;

    const tracks = await this.trackModel
      .find(filter)
      .sort({ featuredRank: -1, title: 1 })
      .exec();

    const enrollments = userId
      ? await this.enrollmentModel.find({ userId }).exec()
      : [];
    const byTrackId = new Map(enrollments.map((e) => [e.trackId, e]));

    return tracks.map((t) => this.toView(t, byTrackId.get(String(t._id)) ?? null));
  }

  /** Only the tracks this user is actually running. */
  async findMine(userId: string): Promise<TrackView[]> {
    const enrollments = await this.enrollmentModel.find({ userId }).exec();
    if (enrollments.length === 0) return [];

    const tracks = await this.trackModel
      .find({ _id: { $in: enrollments.map((e) => e.trackId) } })
      .exec();
    const byId = new Map(tracks.map((t) => [String(t._id), t]));

    return enrollments
      .map((e) => {
        const track = byId.get(e.trackId);
        return track ? this.toView(track, e) : null;
      })
      .filter((v): v is TrackView => v !== null)
      .sort((a, b) => {
        // Active first, then by how far along they are.
        const rank = (s: EnrollmentStatus | null) =>
          s === EnrollmentStatus.ACTIVE ? 0 : s === EnrollmentStatus.COMPLETED ? 2 : 1;
        return rank(a.status) - rank(b.status) || b.ratio - a.ratio;
      });
  }

  async findBySlug(userId: string | null, slug: string): Promise<TrackView> {
    const track = await this.trackModel.findOne({ slug }).exec();
    if (!track) throw new NotFoundException(`Track ${slug} nicht gefunden`);

    const enrollment = userId
      ? await this.enrollmentModel
          .findOne({ userId, trackId: String(track._id) })
          .exec()
      : null;

    return this.toView(track, enrollment);
  }

  /** Accept a track — the "Annehmen" CTA. Idempotent. */
  async accept(userId: string, slug: string): Promise<TrackView> {
    const track = await this.trackModel.findOne({ slug }).exec();
    if (!track) throw new NotFoundException(`Track ${slug} nicht gefunden`);

    const trackId = String(track._id);
    const existing = await this.enrollmentModel
      .findOne({ userId, trackId })
      .exec();

    if (existing) {
      // Re-accepting a track the user gave up on resumes it with its history.
      if (existing.status === EnrollmentStatus.ABANDONED) {
        existing.status = EnrollmentStatus.ACTIVE;
        await existing.save();
      }
      return this.toView(track, existing);
    }

    const now = new Date();
    const deadline = track.durationDays
      ? new Date(now.getTime() + track.durationDays * 86_400_000)
      : null;

    const enrollment = await this.enrollmentModel.create({
      userId,
      trackId,
      trackSlug: track.slug,
      status: EnrollmentStatus.ACTIVE,
      acceptedAt: now,
      deadline,
      objectives: track.objectives.map((o) => ({
        objectiveId: o.id,
        current: 0,
        best: 0,
        lastDayKey: null,
        countedDays: [],
        done: false,
        doneAt: null,
        xpPaid: 0,
      })),
    });

    return this.toView(track, enrollment);
  }

  /** Give up, keeping the progress so it can be resumed later. */
  async abandon(userId: string, slug: string): Promise<TrackView> {
    const track = await this.trackModel.findOne({ slug }).exec();
    if (!track) throw new NotFoundException(`Track ${slug} nicht gefunden`);

    const enrollment = await this.enrollmentModel
      .findOne({ userId, trackId: String(track._id) })
      .exec();
    if (!enrollment) throw new NotFoundException('Nicht angenommen');

    enrollment.status = EnrollmentStatus.ABANDONED;
    await enrollment.save();
    return this.toView(track, enrollment);
  }

  // ─── View rendering ───────────────────────────────────────────────────────

  private toView(
    track: TrackDocument,
    enrollment: EnrollmentDocument | null,
  ): TrackView {
    const raw = track.toObject() as TrackDocument & Record<string, unknown>;
    const currentStep = enrollment?.currentStep ?? 0;

    const objectives: ObjectiveView[] = track.objectives.map((o) => {
      const p = enrollment?.objectives.find((x) => x.objectiveId === o.id);
      const current = p?.current ?? 0;
      const remaining = Math.max(0, o.target - current);
      const locked =
        track.kind === TrackKind.STORY_ARC &&
        o.unlocksAtStep !== null &&
        o.unlocksAtStep > currentStep;

      return {
        id: o.id,
        title: o.title,
        description: o.description,
        emoji: o.emoji,
        kind: o.kind,
        metric: o.metric,
        target: o.target,
        current,
        remaining,
        ratio: o.target > 0 ? Math.min(1, current / o.target) : 0,
        best: p?.best ?? 0,
        done: p?.done ?? false,
        doneAt: p?.doneAt ? p.doneAt.toISOString() : null,
        optional: o.optional,
        locked,
        xpReward: o.xpReward,
        unlocksAtStep: o.unlocksAtStep,
        remainingLabel: this.remainingLabel(o, current, p?.done ?? false),
      };
    });

    const required = objectives.filter((o) => !o.optional);
    const doneCount = required.filter((o) => o.done).length;
    const deadline = enrollment?.deadline ?? null;

    const view: TrackView = {
      id: String(track._id),
      kind: track.kind,
      slug: track.slug,
      title: track.title,
      tagline: track.tagline,
      description: track.description,
      emoji: track.emoji,
      color: track.color,
      category: track.category,
      difficulty: track.difficulty,
      tags: track.tags,
      completionXp: track.completionXp,
      completionCoins: track.completionCoins,
      emblemKey: track.emblemKey,
      durationDays: track.durationDays,
      objectives,
      bonusRules: track.bonusRules.map((b) => ({ id: b.id, label: b.label })),
      enrolled: enrollment !== null,
      status: enrollment?.status ?? null,
      acceptedAt: enrollment?.acceptedAt?.toISOString() ?? null,
      deadline: deadline?.toISOString() ?? null,
      daysLeft: deadline
        ? Math.max(0, daysBetween(toDayKey(new Date()), toDayKey(deadline)))
        : null,
      completedAt: enrollment?.completedAt?.toISOString() ?? null,
      currentStep,
      relapses: enrollment?.relapses ?? 0,
      xpEarned:
        (enrollment?.baseXpEarned ?? 0) + (enrollment?.bonusXpEarned ?? 0),
      doneCount,
      requiredCount: required.length,
      ratio: required.length > 0 ? doneCount / required.length : 0,
      missing: required
        .filter((o) => !o.done && !o.locked)
        .map((o) => `${o.emoji} ${o.remainingLabel}`),
    };

    // Discriminator extras — present only on the kind that defines them.
    if (track.kind === TrackKind.STORY_ARC) {
      view.chapters = (raw.chapters as TrackView['chapters']) ?? [];
      view.conclusion = (raw.conclusion as string | null) ?? null;
    }
    if (track.kind === TrackKind.CHALLENGE) {
      view.relapseMetric = (raw.relapseMetric as string | null) ?? null;
      view.relapseCopy = (raw.relapseCopy as string | null) ?? null;
    }

    return view;
  }

  /**
   * The "was fehlt noch" sentence.
   *
   * Phrased per objective kind because "noch 12" means something different for
   * a streak (consecutive days) than for a tally (any 12 times).
   */
  private remainingLabel(
    o: Objective,
    current: number,
    done: boolean,
  ): string {
    if (done) return `${o.title} — geschafft`;
    const left = Math.max(0, o.target - current);

    switch (o.kind) {
      case ObjectiveKind.SINGLE:
        return o.title;
      case ObjectiveKind.STREAK:
        return current > 0
          ? `noch ${left} Tage am Stück (aktuell ${current})`
          : `${o.target} Tage am Stück`;
      case ObjectiveKind.UNIQUE_DAYS:
        return `noch ${left} von ${o.target} Tagen`;
      case ObjectiveKind.THRESHOLD:
        return `noch ${this.trim(left)} von ${this.trim(o.target)}`;
      case ObjectiveKind.PEAK:
        return `einmal ${this.trim(o.target)} am Stück`;
      case ObjectiveKind.TALLY:
      default:
        return `noch ${left} von ${o.target}`;
    }
  }

  /** 12.0 → "12", 12.5 → "12.5" */
  private trim(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
}
