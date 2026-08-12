import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
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
