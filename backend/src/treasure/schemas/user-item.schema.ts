import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserItemDocument = HydratedDocument<UserItem>;

/** One acquisition event in an item's per-user history. */
export interface ItemHistoryEvent {
  event: 'found' | 'stacked' | 'crafted' | 'lucky_double';
  date: Date;
  lat?: number;
  lng?: number;
  note?: string;
}

/**
 * Inventory entry: which user owns which catalog item, how many copies
 * (stackCount 1–3 — each duplicate raises the effective rarity by one tier),
 * plus the item's acquisition history.
 */
@Schema({ timestamps: true })
export class UserItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  itemId: string;

  @Prop({ default: 1, min: 0, max: 3 })
  stackCount: number;

  @Prop(
    raw([
      {
        event: { type: String, required: true },
        date: { type: Date, required: true },
        lat: { type: Number },
        lng: { type: Number },
        note: { type: String },
      },
    ]),
  )
  history: ItemHistoryEvent[];

  createdAt: Date;
  updatedAt: Date;
}

export const UserItemSchema = SchemaFactory.createForClass(UserItem);

// One stack per item per user.
UserItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });
