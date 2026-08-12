import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestChainDocument = HydratedDocument<QuestChain>;

export interface ChainStep {
  index: number;
  title: string;
  clue: string;
  lat: number;
  lng: number;
  completed: boolean;
  completedAt: Date | null;
}

/**
 * A pet-offered detective journey: a short story told across randomly placed
 * GPS waypoints (~1 km walk). Steps unlock in order; the finale grants XP, a
 * perk and sometimes an egg.
 */
@Schema({ timestamps: true })
export class QuestChain {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  storyId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  intro: string;

  @Prop({ required: true, enum: ['offered', 'active', 'completed', 'expired'] })
  status: 'offered' | 'active' | 'completed' | 'expired';

  @Prop({ type: Array, default: [] })
  steps: ChainStep[];

  @Prop({ required: true })
  conclusion: string;

  @Prop({ required: true })
  perkId: string;

  @Prop({ default: 0 })
  eggChance: number;

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestChainSchema = SchemaFactory.createForClass(QuestChain);
QuestChainSchema.index({ userId: 1, status: 1 });
