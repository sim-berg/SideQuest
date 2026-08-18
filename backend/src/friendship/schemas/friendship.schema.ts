import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FriendshipDocument = HydratedDocument<Friendship>;

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

/**
 * A Kumpanen bond between two users. One document covers the whole
 * relationship: it starts as `pending` when the requester sends the
 * invitation and flips to `accepted` once the addressee agrees.
 */
@Schema({ timestamps: true })
export class Friendship {
  @Prop({ required: true, index: true })
  requesterId: string;

  @Prop({ required: true, index: true })
  addresseeId: string;

  @Prop({ required: true, default: 'pending', index: true })
  status: FriendshipStatus;

  /** Optional note the requester sent along ("Sehen uns beim Lauftreff?"). */
  @Prop({ default: '', maxlength: 200 })
  message: string;

  @Prop({ type: Date, default: null })
  respondedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

// At most one bond per ordered pair; the service checks both directions
// before creating, so a mutual request resolves instead of duplicating.
FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });
