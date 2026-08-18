import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserAchievementDocument = HydratedDocument<UserAchievement>;

/** How an emblem came to be earned — drives the wording in the emblem log. */
export type EmblemSource =
  | 'sidequest'
  | 'daily'
  | 'quest'
  | 'milestone'
  | 'signup';

/**
 * Join record: which user earned which achievement, when, and from where.
 *
 * The log fields below are denormalized on purpose — an emblem's story ("15.
 * Mai, Tempelhofer Feld, 10 Kniebeugen") has to stay readable even after the
 * quest that granted it is edited or deleted.
 */
@Schema({ timestamps: true })
export class UserAchievement {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  achievementKey: string;

  /** The quest / daily side quest that triggered the award (relation). */
  @Prop({ type: String, default: null })
  sourceSideQuestId: string | null;

  @Prop({ type: String, default: 'milestone' })
  sourceKind: EmblemSource;

  /** Title of the quest at the moment it was completed. */
  @Prop({ default: '' })
  questTitle: string;

  @Prop({ default: '' })
  questCategory: string;

  /** Where the user stood when it was earned (null = not recorded). */
  @Prop({ type: Number, default: null })
  lat: number | null;

  @Prop({ type: Number, default: null })
  lng: number | null;

  /** Human-readable place ("Tempelhofer Feld, Berlin"), best effort. */
  @Prop({ default: '' })
  placeLabel: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserAchievementSchema =
  SchemaFactory.createForClass(UserAchievement);

// One copy of each achievement per user.
UserAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
