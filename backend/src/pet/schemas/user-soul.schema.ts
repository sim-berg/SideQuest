import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserSoulDocument = HydratedDocument<UserSoul>;

/**
 * The user's "soul.md": a markdown profile of how this adventurer plays,
 * periodically rebuilt from their activity. The pet reads it to personalize
 * daily quests and chat.
 */
@Schema({ timestamps: true })
export class UserSoul {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: '' })
  content: string;

  /** Day bucket (YYYY-MM-DD) of the last rebuild — one refresh per day. */
  @Prop({ type: String, default: null })
  lastBuiltDate: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSoulSchema = SchemaFactory.createForClass(UserSoul);
