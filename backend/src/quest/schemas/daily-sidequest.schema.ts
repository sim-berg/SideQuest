import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Category } from '../enums/category.enum.js';
import { Difficulty } from '../enums/difficulty.enum.js';

export type DailySideQuestDocument = HydratedDocument<DailySideQuest>;

/**
 * A per-user daily side quest. A fresh set is generated each day from the
 * side quest template pool and completed by self-report (no GPS), awarding
 * dragon XP and the matching achievement.
 */
@Schema({ timestamps: true })
export class DailySideQuest {
  @Prop({ required: true, index: true })
  userId: string;

  /** Day bucket, YYYY-MM-DD. */
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: Category })
  category: Category;

  @Prop({ required: true, enum: Difficulty })
  difficulty: Difficulty;

  @Prop({ required: true })
  xpReward: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const DailySideQuestSchema =
  SchemaFactory.createForClass(DailySideQuest);

DailySideQuestSchema.index({ userId: 1, date: 1 });
