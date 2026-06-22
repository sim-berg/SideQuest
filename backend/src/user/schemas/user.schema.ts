import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true, minlength: 3, maxlength: 24 })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  bio: string;

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
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
