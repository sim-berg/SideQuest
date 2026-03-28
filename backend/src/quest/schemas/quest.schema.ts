import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Category } from '../enums/category.enum.js';
import { Difficulty } from '../enums/difficulty.enum.js';
import { GoalType } from '../enums/goal-type.enum.js';

export type QuestDocument = HydratedDocument<Quest>;

@Schema({ timestamps: true })
export class Quest {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, enum: Category })
  category: Category;

  @Prop(
    raw({
      name: { type: String, required: true },
      avatar: { type: String },
    }),
  )
  questGiver: { name: string; avatar?: string };

  @Prop()
  reward?: number;

  @Prop()
  timeLimit?: string;

  @Prop({ default: Difficulty.MEDIUM, enum: Difficulty })
  difficulty: Difficulty;

  @Prop({ default: GoalType.PROXIMITY, enum: GoalType })
  goalType: GoalType;

  @Prop({ type: Number, default: null })
  goalCount: number | null;

  @Prop({ type: String, default: null })
  acceptedBy: string | null;

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: String, default: null })
  completedBy: string | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
