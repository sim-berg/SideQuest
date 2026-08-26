import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** One self-declared link on a profile (portfolio, socials, playlist, ...). */
@Schema({ _id: false })
export class ProfileLink {
  @Prop({ required: true, trim: true, maxlength: 40 })
  label: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  url: string;

  /** Free-form icon hint the frontend maps to a glyph ("instagram", "web"). */
  @Prop({ default: '', trim: true, maxlength: 24 })
  icon: string;
}

export const ProfileLinkSchema = SchemaFactory.createForClass(ProfileLink);

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

  /** Short "what I'm up to" line shown next to the name. */
  @Prop({ default: '', trim: true, maxlength: 80 })
  status: string;

  /** Signals to the community that quest invites are welcome right now. */
  @Prop({ default: true })
  openForQuests: boolean;

  /** Id from CHARACTER_CLASSES; empty means the user hasn't picked one. */
  @Prop({ default: '', trim: true })
  characterClass: string;

  /** Where the user roams ("Berlin Neukölln") — self-declared, not GPS. */
  @Prop({ default: '', trim: true, maxlength: 60 })
  homeRegion: string;

  /** Accent color for the profile card, as a #rrggbb hex string. */
  @Prop({ default: '', trim: true, maxlength: 7 })
  accentColor: string;

  @Prop({ type: [ProfileLinkSchema], default: [] })
  links: ProfileLink[];

  /**
   * Emblem keys the user pinned to the top of their profile, in their chosen
   * order. Validated against what they actually earned on write.
   */
  @Prop({ type: [String], default: [] })
  featuredEmblems: string[];

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

  // Filled in by `timestamps: true`; declared so "member since" can be read
  // off the document without a cast.
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
