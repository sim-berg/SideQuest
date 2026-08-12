import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

/**
 * A logbook comment on a (side) quest. Author display fields are denormalized
 * at post time so the thread renders without extra joins. Either `body` or
 * `imageUrl` (or both) is present.
 */
@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, index: true })
  questId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: '' })
  username: string;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @Prop({ default: '' })
  body: string;

  /** Absolute URL to an attached image, served from /uploads/comments. */
  @Prop({ type: String, default: null })
  imageUrl: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ questId: 1, createdAt: 1 });
