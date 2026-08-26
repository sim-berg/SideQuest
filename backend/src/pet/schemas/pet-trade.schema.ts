import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PetTradeDocument = HydratedDocument<PetTrade>;

export type PetTradeStatus = 'open' | 'accepted' | 'declined' | 'cancelled';

/**
 * A directed trade offer: "I give you this pet for `price` coins." Price 0
 * is a gift. Ownership moves (and coins flow through the ledger) only when
 * the receiver accepts.
 */
@Schema({ timestamps: true })
export class PetTrade {
  @Prop({ required: true, index: true })
  petId: string;

  @Prop({ required: true, index: true })
  fromUserId: string;

  @Prop({ required: true, index: true })
  toUserId: string;

  /** Asking price in coins; 0 = gift. */
  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 'open' })
  status: PetTradeStatus;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const PetTradeSchema = SchemaFactory.createForClass(PetTrade);
PetTradeSchema.index({ status: 1, toUserId: 1 });
