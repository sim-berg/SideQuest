import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmbeddingCacheDocument = HydratedDocument<EmbeddingCache>;

/**
 * Content-addressed embedding cache.
 *
 * Side quests are spawned from a small template pool, so the same title and
 * description get indexed hundreds of times. Keying by sha256(model + text)
 * means each distinct wording costs exactly one Replicate call, ever — the
 * thousandth spawn of "Finde den versteckten Brunnen" is a Mongo read.
 */
@Schema({ timestamps: true })
export class EmbeddingCache {
  /** sha256 over `${model}\n${text}` — the cache key. */
  @Prop({ required: true, unique: true, index: true })
  hash: string;

  /**
   * Replicate model (incl. pinned version) that produced this vector.
   * Not named `model` — that collides with Mongoose's Document.model().
   */
  @Prop({ required: true })
  modelId: string;

  @Prop({ required: true })
  dims: number;

  /**
   * Float32Array as base64 — 4 bytes per dimension instead of the ~20 bytes
   * a BSON double array would cost per entry.
   */
  @Prop({ required: true })
  vector: string;

  createdAt: Date;
  updatedAt: Date;
}

export const EmbeddingCacheSchema =
  SchemaFactory.createForClass(EmbeddingCache);
