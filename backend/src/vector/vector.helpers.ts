/**
 * Pure helpers for the vector layer — id mapping, the vector codec, the text
 * that gets embedded, and the Qdrant filter builder.
 *
 * Deliberately free of Nest and Mongoose imports: these are the pieces that
 * silently corrupt the whole index when they are subtly wrong (a non-bijective
 * id mapping deletes live quests; a broken codec returns noise), so they have
 * to be unit-testable without booting an ORM.
 */

/** Qdrant filter clause — kept loose on purpose, the DSL is large. */
export type QdrantFilter = Record<string, unknown>;

export interface QuestSearchOptions {
  limit?: number;
  categories?: string[];
  types?: string[];
  lat?: number;
  lng?: number;
  /** Kilometers. Only applied together with lat/lng. */
  radius?: number;
  includeSideQuests?: boolean;
  includeCompleted?: boolean;
  scoreThreshold?: number;
}

/**
 * Qdrant point ids must be an unsigned int or a UUID. A Mongo ObjectId is 24
 * hex chars, so zero-pad it to 32 and format as a UUID — deterministic and
 * reversible, which is what the orphan sweep needs.
 */
export function pointId(objectId: string): string {
  const hex = objectId.padEnd(32, '0');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export function objectIdFromPointId(id: string): string {
  return id.replace(/-/g, '').slice(0, 24);
}

/** Float32Array → base64, ~4x smaller than a BSON array of doubles. */
export function encodeVector(vector: number[]): string {
  const floats = Float32Array.from(vector);
  return Buffer.from(
    floats.buffer,
    floats.byteOffset,
    floats.byteLength,
  ).toString('base64');
}

export function decodeVector(encoded: string): number[] {
  const buf = Buffer.from(encoded, 'base64');
  // Copy: the Buffer pool's byteOffset is rarely 4-byte aligned, which
  // Float32Array's constructor rejects outright.
  const copy = new Uint8Array(buf.byteLength);
  copy.set(buf);
  return Array.from(new Float32Array(copy.buffer));
}

/**
 * The text that actually gets embedded: title, description, place name.
 *
 * The category is deliberately *not* in here. A labelled enum line
 * ("Kategorie: sport") reads as near-identical boilerplate across every quest
 * and measurably flattened the ranking — with it, "ich will mich richtig
 * auspowern" ranked "Erkunde die Karte" above "Mach 10 Kniebeugen!"; without
 * it, the squats win. Category is a payload filter, not meaning.
 */
export function buildText(q: {
  title: string;
  description: string;
  address?: string;
}): string {
  return [q.title, q.description, q.address].filter(Boolean).join('\n');
}

export function buildFilter(
  opts: QuestSearchOptions,
): QdrantFilter | undefined {
  const must: Record<string, unknown>[] = [];

  if (!opts.includeCompleted) {
    must.push({ key: 'completed', match: { value: false } });
  }
  if (!opts.includeSideQuests) {
    must.push({ key: 'isSideQuest', match: { value: false } });
  }
  if (opts.categories?.length) {
    must.push({ key: 'category', match: { any: opts.categories } });
  }
  if (opts.types?.length) {
    must.push({ key: 'type', match: { any: opts.types } });
  }
  if (opts.lat != null && opts.lng != null && opts.radius) {
    must.push({
      key: 'location',
      geo_radius: {
        center: { lat: opts.lat, lon: opts.lng },
        radius: opts.radius * 1000,
      },
    });
  }

  // Expired side quests are still points until the sweep removes them.
  const nowSec = Math.floor(Date.now() / 1000);
  must.push({
    should: [
      { key: 'expiresAt', match: { value: 0 } },
      { key: 'expiresAt', range: { gte: nowSec } },
    ],
  });

  return must.length > 0 ? { must } : undefined;
}
