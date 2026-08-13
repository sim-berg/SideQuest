import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestRedemptionDocument = HydratedDocument<QuestRedemption>;

/**
 * One user's QR redemption of a world quest. World quests are multi-user, so
 * completion lives here instead of in the quest's single `completedBy`.
 */
@Schema({ timestamps: true })
export class QuestRedemption {
  @Prop({ required: true, index: true })
  questId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  coins: number;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestRedemptionSchema =
  SchemaFactory.createForClass(QuestRedemption);
QuestRedemptionSchema.index({ questId: 1, userId: 1 }, { unique: true });
