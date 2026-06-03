import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AchievementDocument = HydratedDocument<Achievement>;

/**
 * Catalog entry for an achievement. The badge image is generated once (lazily)
 * and cached here, then shared by every user who earns it.
 */
@Schema({ timestamps: true })
export class Achievement {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  /** Absolute URL to the badge image (AI PNG or SVG fallback). */
  @Prop({ type: String, default: null })
  imageUrl: string | null;

  /** true once the real AI image has replaced the fallback. */
  @Prop({ default: false })
  aiGenerated: boolean;

  @Prop({ type: String, default: null })
  sideQuestTemplateId: string | null;

  @Prop({ default: '#f59e0b' })
  color: string;

  @Prop({ default: '🏅' })
  emoji: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
