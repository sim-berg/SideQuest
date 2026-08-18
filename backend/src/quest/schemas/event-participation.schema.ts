import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventParticipationDocument = HydratedDocument<EventParticipation>;

/**
 * One user's attendance at an event quest. Presence accrues through periodic
 * check-ins from inside the event radius: each heartbeat within the allowed
 * gap adds the elapsed time to `presenceMinutes`.
 */
@Schema({ timestamps: true })
export class EventParticipation {
  @Prop({ required: true, index: true })
  questId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  joinedAt: Date;

  @Prop({ type: Date, default: null })
  lastCheckinAt: Date | null;

  @Prop({ default: 0 })
  presenceMinutes: number;

  /** Reward already claimed from the escrow pool. */
  @Prop({ default: false })
  rewardPaid: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const EventParticipationSchema =
  SchemaFactory.createForClass(EventParticipation);
EventParticipationSchema.index({ questId: 1, userId: 1 }, { unique: true });
