import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WalletDocument = HydratedDocument<Wallet>;

/**
 * Materialized balance of one ledger account. `accountId` is a user id or a
 * virtual account like `escrow:<questId>`. The balance is derivable from the
 * transaction ledger — it is kept here only as a fast read model, which is
 * also why it can be dropped wholesale when the ledger moves on-chain.
 */
@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true, unique: true })
  accountId: string;

  @Prop({ default: 0, min: 0 })
  balance: number;

  createdAt: Date;
  updatedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
