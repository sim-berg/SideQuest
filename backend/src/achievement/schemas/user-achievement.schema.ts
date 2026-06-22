import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserAchievementDocument = HydratedDocument<UserAchievement>;

/** Join record: which user earned which achievement, when, and from where. */
@Schema({ timestamps: true })
export class UserAchievement {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  achievementKey: string;

  /** The quest / daily side quest that triggered the award (relation). */
  @Prop({ type: String, default: null })
  sourceSideQuestId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserAchievementSchema =
  SchemaFactory.createForClass(UserAchievement);

// One copy of each achievement per user.
UserAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
