import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DragonType } from '../enums/dragon-type.enum.js';
import { EvolutionStage } from '../enums/evolution-stage.enum.js';

export type DragonDocument = HydratedDocument<Dragon>;

@Schema({ timestamps: true })
export class Dragon {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, enum: DragonType })
  type: DragonType;

  @Prop()
  name?: string;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: EvolutionStage.EGG, enum: EvolutionStage })
  evolutionStage: EvolutionStage;

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

export const DragonSchema = SchemaFactory.createForClass(Dragon);
