import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileCommentDocument = HydratedDocument<ProfileComment>;

/**
 * A note left on someone's profile — the community's guest book.
 *
 * Author display fields are denormalized at post time so a wall renders
 * without a join, but `authorId` stays the source of truth for linking back
 * to the author's profile.
 */
@Schema({ timestamps: true })
export class ProfileComment {
  /** Whose wall this note sits on. */
  @Prop({ required: true, index: true })
  profileUserId: string;

  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ default: '' })
  authorName: string;

  @Prop({ type: String, default: null })
  authorAvatarUrl: string | null;

  @Prop({ required: true, maxlength: 500 })
  body: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ProfileCommentSchema =
  SchemaFactory.createForClass(ProfileComment);

ProfileCommentSchema.index({ profileUserId: 1, createdAt: -1 });
