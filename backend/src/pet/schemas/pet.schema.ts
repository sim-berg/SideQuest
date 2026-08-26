import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Element } from '../enums/element.enum.js';
import { PetStage } from '../enums/pet-stage.enum.js';

export type PetDocument = HydratedDocument<Pet>;

/**
 * One pet in a user's menagerie. A pet starts as a mystery egg (species and
 * element are null until it hatches) and exactly one pet per user is the
 * active guide that earns XP and generates quests.
 */
@Schema({ timestamps: true })
export class Pet {
  @Prop({ required: true, index: true })
  userId: string;

  /** Species id from the catalog; null while still an unhatched egg. */
  @Prop({ type: String, default: null })
  species: string | null;

  @Prop({ type: String, enum: Element, default: null })
  element: Element | null;

  /** User-given nickname. */
  @Prop()
  name?: string;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: PetStage.EGG, enum: PetStage })
  stage: PetStage;

  /** The one companion currently guiding the user. */
  @Prop({ default: false })
  isActive: boolean;

  /** 'starter' | 'migration' | 'chain' | 'treasure' */
  @Prop({ default: 'starter' })
  obtainedFrom: string;

  /** Markdown personality document ("soul.md"), written at hatch. */
  @Prop({ default: '' })
  soul: string;

  /** Perk ids earned through quest chains. */
  @Prop({ type: [String], default: [] })
  perks: string[];

  /**
   * Generated portrait per evolution stage (stage → image URL). Filled
   * lazily by PetImageService; the current stage's entry is what the UI
   * shows, older stages stay as the pet's "photo album".
   */
  @Prop({ type: Object, default: {} })
  images: Record<string, string>;

  /**
   * The pet's soul growth: how many quests of each category it lived
   * through with its human. Grows on every completion and shapes the
   * pet's character (dominant category ⇒ soul alignment).
   */
  @Prop({ type: Object, default: {} })
  soulXp: Record<string, number>;

  /** Equipped treasure item ids (max slots enforced in the service). */
  @Prop({ type: [String], default: [] })
  equipment: string[];

  /**
   * Free-form expansion bag for future pet features (accessoires, moods,
   * battle stats, ...) — new features can land here without a migration.
   */
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  attributes: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  hatchedAt: Date | null;

  // Quest streak bookkeeping (ported from the old dragon).
  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ type: String, default: null })
  lastStreakDate: string | null;

  @Prop({ type: Date, default: null })
  lastQuestCompletedAt: Date | null;

  @Prop({ default: 0 })
  questsCompletedToday: number;

  @Prop({ type: String, default: null })
  lastQuestDate: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
PetSchema.index({ userId: 1, isActive: 1 });
