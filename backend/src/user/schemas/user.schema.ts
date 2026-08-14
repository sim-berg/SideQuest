import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 24,
  })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  bio: string;

  /**
   * User-authored CSS for their profile card (MySpace spirit). Sanitized on
   * write and scoped to the profile container on render.
   */
  @Prop({ default: '' })
  profileCss: string;

  /**
   * Alias for quests the user publishes without revealing their identity.
   * Never included in public profile responses.
   */
  @Prop({ default: '', trim: true, maxlength: 24 })
  pseudonym: string;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  questsCompleted: number;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeenAt: Date;

  @Prop({ default: false })
  shareLocation: boolean;

  @Prop({ default: false })
  hasDragon: boolean;

  @Prop({ default: 0 })
  totalXp: number;

  @Prop({ default: 0 })
  loginStreak: number;

  @Prop({ type: Date, default: null })
  lastLoginDate: Date | null;

  /** Consecutive days on which all daily quests were cleared. */
  @Prop({ default: 0 })
  dailyQuestStreak: number;

  @Prop({ default: 0 })
  longestDailyQuestStreak: number;

  /** Day bucket (YYYY-MM-DD) of the last fully cleared daily board. */
  @Prop({ type: String, default: null })
  lastDailyQuestDate: string | null;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
