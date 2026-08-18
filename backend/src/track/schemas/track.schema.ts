import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Category } from '../../quest/enums/category.enum.js';
import { Difficulty } from '../../quest/enums/difficulty.enum.js';
import {
  BonusTrigger,
  Metric,
  ObjectiveKind,
  TrackKind,
} from '../enums/track.enums.js';

/**
 * One measurable goal inside a track.
 *
 * An objective never stores progress — it only declares what to listen for.
 * The running totals live per user in ObjectiveProgress (enrollment.schema.ts),
 * so the same catalog entry can be run by thousands of users at once.
 */
export interface Objective {
  /** Stable within its track; progress rows reference this. */
  id: string;
  title: string;
  description: string;
  emoji: string;
  kind: ObjectiveKind;
  metric: Metric;
  /** How much of `metric` finishes this objective (days, count, km …). */
  target: number;
  /**
   * Metric that breaks a STREAK objective back to zero — a relapse.
   * Ignored by every other kind.
   */
  resetOn: Metric | null;
  /**
   * Optional objectives are not required to finish the track, but they pay XP
   * and count towards the PERFECT_RUN bonus. This is the "joggen zählt auf die
   * Rauchfrei-Challenge ein, ist aber keine Pflicht" case.
   */
  optional: boolean;
  xpReward: number;
  /**
   * Chapter index for StoryArc: objectives unlock in ascending order.
   * null (the default) means "available immediately", which is what
   * Challenge and Event use.
   */
  unlocksAtStep: number | null;
}

/**
 * A declarative XP bonus. Evaluated by BonusService against the progress event
 * and the enrollment, so new bonuses are catalog data rather than new code.
 */
export interface BonusRule {
  id: string;
  label: string;
  trigger: BonusTrigger;
  /** Threshold the trigger compares against (hour, streak length, km …). */
  value: number;
  /** Flat XP added on top. */
  flatXp: number;
  /** Multiplier applied to the objective's XP (1 = none). */
  multiplier: number;
}

export type TrackDocument = HydratedDocument<Track>;

/**
 * Base class for everything that bundles quests into a bigger arc.
 *
 * Challenge, StoryArc and EventTrack extend this via Mongoose discriminators:
 * one collection, one shared shape, per-kind extras. Adding a fourth kind means
 * adding a discriminator, not touching this class.
 */
@Schema({
  timestamps: true,
  discriminatorKey: 'kind',
  collection: 'tracks',
})
export class Track {
  /**
   * Discriminator key — declared for TypeScript but deliberately NOT a @Prop:
   * Mongoose owns this path (see `discriminatorKey` below) and stamps it on
   * write. Declaring it twice makes it vanish from query results.
   */
  kind: TrackKind;

  /** Stable catalog key, e.g. 'ch_quit_smoking'. Unique across all kinds. */
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  /** One-line hook shown on the card. */
  @Prop({ required: true })
  tagline: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  emoji: string;

  /** Accent colour for the card, hex. */
  @Prop({ required: true })
  color: string;

  @Prop({ required: true, enum: Category, index: true })
  category: Category;

  @Prop({ default: Difficulty.MEDIUM, enum: Difficulty })
  difficulty: Difficulty;

  @Prop({ type: [Object], default: [] })
  objectives: Objective[];

  @Prop({ type: [Object], default: [] })
  bonusRules: BonusRule[];

  /** XP paid on top of the per-objective XP when the whole track is done. */
  @Prop({ default: 0 })
  completionXp: number;

  /** Coins paid on completion. */
  @Prop({ default: 0 })
  completionCoins: number;

  /** Achievement key granted on completion — the emblem. */
  @Prop({ type: String, default: null })
  emblemKey: string | null;

  /**
   * Days the user has to finish after accepting. null = open-ended, which is
   * what most habit challenges use.
   */
  @Prop({ type: Number, default: null })
  durationDays: number | null;

  /** Hidden from the pool without removing existing enrollments. */
  @Prop({ default: true, index: true })
  published: boolean;

  /** Sort weight in the pool — higher floats to the top. */
  @Prop({ default: 0 })
  featuredRank: number;

  /** Free-form tags for the pool filter ('hype', 'fitness', 'schule'). */
  @Prop({ type: [String], default: [] })
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const TrackSchema = SchemaFactory.createForClass(Track);

// ─── Discriminator: Challenge ───────────────────────────────────────────────

/**
 * Self-paced habit work. Every objective is open from day one and they are
 * chased in parallel — quit smoking while also jogging while also journalling.
 */
@Schema()
export class Challenge {
  /**
   * Objectives the user may swap out for their own quests, by objective id.
   * Lets "joggen" be replaced by "schwimmen" without forking the catalog.
   */
  @Prop({ type: [String], default: [] })
  swappableObjectiveIds: string[];

  /**
   * Metric whose relapse event is worth surfacing prominently in the UI
   * (the "ich habe geraucht" button). null for challenges without a relapse.
   */
  @Prop({ type: String, default: null })
  relapseMetric: Metric | null;

  /** Copy shown after a relapse — the tone is the whole point here. */
  @Prop({ type: String, default: null })
  relapseCopy: string | null;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);

// ─── Discriminator: StoryArc ────────────────────────────────────────────────

/** One narrated chapter of a story arc. */
export interface ArcChapter {
  step: number;
  title: string;
  /** Shown when the chapter unlocks. */
  intro: string;
  /** Shown once its objectives are done. */
  outro: string;
}

/**
 * A narrated sequence. Objectives unlock chapter by chapter, so the order is
 * the content — this is the shape QuestChain already hints at, generalised.
 */
@Schema()
export class StoryArc {
  @Prop({ type: [Object], default: [] })
  chapters: ArcChapter[];

  /** Closing text after the final chapter. */
  @Prop({ type: String, default: null })
  conclusion: string | null;

  /** Later chapters stay hidden until unlocked. */
  @Prop({ default: true })
  hideFutureChapters: boolean;
}

export const StoryArcSchema = SchemaFactory.createForClass(StoryArc);

// ─── Discriminator: EventTrack ──────────────────────────────────────────────

/**
 * A time-boxed, place-bound bundle. Reuses the existing event quest fields so
 * an organiser can hang several side quests off one gathering.
 */
@Schema()
export class EventTrack {
  @Prop({ type: Date, default: null })
  startsAt: Date | null;

  @Prop({ type: Date, default: null })
  endsAt: Date | null;

  @Prop({ type: Number, default: null })
  lat: number | null;

  @Prop({ type: Number, default: null })
  lng: number | null;

  @Prop({ type: String, default: null })
  address: string | null;

  /** Quest ids belonging to this event. */
  @Prop({ type: [String], default: [] })
  questIds: string[];

  /** Organiser user id. */
  @Prop({ type: String, default: null })
  createdBy: string | null;
}

export const EventTrackSchema = SchemaFactory.createForClass(EventTrack);
