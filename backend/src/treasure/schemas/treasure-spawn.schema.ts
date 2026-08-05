import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Rarity } from '../enums/rarity.enum.js';

export type TreasureSpawnDocument = HydratedDocument<TreasureSpawn>;

/**
 * A treasure chest dropped on the map by the spawner worker. Uncollected
 * spawns despawn once `expiresAt` passes; collected ones are kept briefly as
 * an audit trail and swept by the worker.
 */
@Schema({ timestamps: true })
export class TreasureSpawn {
  @Prop({ required: true })
  itemId: string;

  @Prop({ required: true, enum: Rarity })
  rarity: Rarity;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: String, default: null })
  collectedBy: string | null;

  @Prop({ type: Date, default: null })
  collectedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const TreasureSpawnSchema = SchemaFactory.createForClass(TreasureSpawn);

TreasureSpawnSchema.index({ collectedBy: 1, expiresAt: 1 });
