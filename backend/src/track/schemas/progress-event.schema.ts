import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Metric, ProgressSource } from '../enums/track.enums.js';

export type ProgressEventDocument = HydratedDocument<ProgressEvent>;

/**
 * An immutable "this happened" record.
 *
 * Progress events are the seam of the whole Track domain: the rest of the app
 * (quests, routes, daily board, check-ins) only ever emits one of these, and
 * never knows which tracks exist. ProgressService fans a single event out to
 * every enrollment that listens on the metric — that is what makes one jog
 * count towards a smoking challenge, a route streak and its own quest at once.
 *
 * They are kept rather than folded away so progress can be recomputed after a
 * catalog change, and so the UI can show a real history.
 */
@Schema({ timestamps: true, collection: 'progress_events' })
export class ProgressEvent {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: Metric, index: true })
  metric: Metric;

  /** Count, kilometres, minutes … — unit is implied by the metric. */
  @Prop({ default: 1 })
  value: number;

  @Prop({ required: true, enum: ProgressSource })
  source: ProgressSource;

  /** Local day key (YYYY-MM-DD) the event belongs to. Drives streak logic. */
  @Prop({ required: true, index: true })
  dayKey: string;

  /**
   * Context for bonus rules and drill-down: templateId, questId, category,
   * placeId, tempC, companionId … Deliberately open — bonus triggers read it
   * by name and new signals must not need a migration.
   */
  @Prop({ type: Object, default: {} })
  meta: Record<string, unknown>;

  /**
   * Idempotency key. A quest completion must not count twice if the client
   * retries, so callers pass a stable key (e.g. `quest:<id>`).
   */
  @Prop({ type: String, default: null, index: true })
  dedupeKey: string | null;

  /** When it actually happened (may differ from createdAt on backfill). */
  @Prop({ required: true })
  occurredAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ProgressEventSchema = SchemaFactory.createForClass(ProgressEvent);

// A dedupeKey may be used once per user.
ProgressEventSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } },
);

ProgressEventSchema.index({ userId: 1, metric: 1, dayKey: -1 });
