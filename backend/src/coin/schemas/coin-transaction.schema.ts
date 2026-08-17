import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CoinTransactionDocument = HydratedDocument<CoinTransaction>;

/**
 * Append-only ledger entry. `from`/`to` are account ids (user id, an
 * `escrow:*` account, or the literal `system` for mints and burns). This is
 * the collection a future blockchain replaces — nothing else in the app may
 * change a balance without writing one of these.
 */
@Schema({ timestamps: true })
export class CoinTransaction {
  @Prop({ required: true, index: true })
  from: string;

  @Prop({ required: true, index: true })
  to: string;

  @Prop({ required: true, min: 1 })
  amount: number;

  /** Machine-readable cause: 'starter_grant', 'quest_reward', 'event_stake', 'pet_trade', ... */
  @Prop({ required: true })
  reason: string;

  /** Optional link to the entity that caused the transfer (quest, trade, ...). */
  @Prop({ type: String, default: null })
  refType: string | null;

  @Prop({ type: String, default: null })
  refId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const CoinTransactionSchema =
  SchemaFactory.createForClass(CoinTransaction);
CoinTransactionSchema.index({ createdAt: -1 });
