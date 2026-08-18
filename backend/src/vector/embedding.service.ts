import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import Replicate from 'replicate';
import {
  EmbeddingCache,
  EmbeddingCacheDocument,
} from './schemas/embedding-cache.schema.js';
import { decodeVector, encodeVector } from './vector.helpers.js';

/**
 * multilingual-e5-large on Replicate. Community model, so the version stays
 * pinned — the version-less endpoint only exists for official models.
 * 1024 dimensions, normalized, and genuinely multilingual: German quest text
 * and a German query land in the same space without a translation step.
 */
const DEFAULT_MODEL =
  'beautyyuyanli/multilingual-e5-large:a06276a89f1a902d5fc225a9ca32b6e8e6292b7f3b136518878da97c458e2bad';

/** E5 was trained with these prefixes — dropping them measurably hurts recall. */
const PASSAGE_PREFIX = 'passage: ';
const QUERY_PREFIX = 'query: ';

/** Replicate's own cap for this model's batching; keep requests below it. */
const MAX_BATCH = 32;

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly token?: string;
  private readonly model: string;
  readonly dims: number;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(EmbeddingCache.name)
    private readonly cacheModel: Model<EmbeddingCacheDocument>,
  ) {
    this.token = this.config.get<string>('REPLICATE_API_TOKEN');
    this.model = this.config.get<string>(
      'REPLICATE_EMBED_MODEL',
      DEFAULT_MODEL,
    );
    this.dims = Number(this.config.get<string>('EMBEDDING_DIMS', '1024'));
    this.timeoutMs = Number(
      this.config.get<string>('EMBEDDING_TIMEOUT_MS', '60000'),
    );
  }

  /** Embeddings are only possible with a Replicate token configured. */
  get enabled(): boolean {
    return !!this.token;
  }

  /** Cache key — the model is part of it so a model swap can't serve stale vectors. */
  private key(text: string): string {
    return createHash('sha256').update(`${this.model}\n${text}`).digest('hex');
  }

  /**
   * Embed quest texts. Returns one vector per input in the same order, or
   * null for entries that could not be embedded (no token, API failure) —
   * callers treat null as "leave it dirty, try again next round" rather than
   * writing a garbage vector into the index.
   */
  async embedPassages(texts: string[]): Promise<(number[] | null)[]> {
    return this.embed(texts.map((t) => PASSAGE_PREFIX + t));
  }

  /** Embed a search query. Cached too, so a repeated search skips the API. */
  async embedQuery(text: string): Promise<number[] | null> {
    const [vector] = await this.embed([QUERY_PREFIX + text]);
    return vector;
  }

  private async embed(prefixed: string[]): Promise<(number[] | null)[]> {
    if (prefixed.length === 0) return [];

    const out: (number[] | null)[] = prefixed.map(() => null);
    const keys = prefixed.map((t) => this.key(t));

    // 1. Serve what the cache already knows.
    const cached = await this.cacheModel
      .find({ hash: { $in: keys } })
      .select('hash vector')
      .exec();
    const byHash = new Map(cached.map((c) => [c.hash, c.vector]));

    const missing: { index: number; text: string; key: string }[] = [];
    prefixed.forEach((text, i) => {
      const hit = byHash.get(keys[i]);
      if (hit) out[i] = decodeVector(hit);
      else missing.push({ index: i, text, key: keys[i] });
    });

    if (missing.length === 0 || !this.token) {
      if (missing.length > 0) {
        this.logger.warn(
          `No REPLICATE_API_TOKEN — ${missing.length} text(s) left unembedded`,
        );
      }
      return out;
    }

    // 2. Embed the rest in batches. De-dupe within the request: the same
    //    wording can appear more than once in a single backfill page.
    const unique = new Map<string, string>();
    for (const m of missing) unique.set(m.key, m.text);
    const uniqueEntries = [...unique.entries()];
    const fresh = new Map<string, number[]>();

    for (let i = 0; i < uniqueEntries.length; i += MAX_BATCH) {
      const batch = uniqueEntries.slice(i, i + MAX_BATCH);
      const vectors = await this.runReplicate(batch.map(([, text]) => text));
      if (!vectors) continue;

      batch.forEach(([key], j) => {
        const vector = vectors[j];
        if (Array.isArray(vector) && vector.length === this.dims) {
          fresh.set(key, vector);
        }
      });
    }

    if (fresh.size === 0) return out;

    // 3. Fill in and persist. A concurrent writer may have inserted the same
    //    hash meanwhile — upsert makes that a no-op instead of a duplicate-key
    //    error that would throw away a paid-for vector.
    for (const m of missing) {
      const vector = fresh.get(m.key);
      if (vector) out[m.index] = vector;
    }

    await this.cacheModel.bulkWrite(
      [...fresh.entries()].map(([hash, vector]) => ({
        updateOne: {
          filter: { hash },
          update: {
            $setOnInsert: {
              hash,
              modelId: this.model,
              dims: this.dims,
              vector: encodeVector(vector),
            },
          },
          upsert: true,
        },
      })),
    );

    return out;
  }

  /** One Replicate prediction. Returns null on any failure — never throws. */
  private async runReplicate(texts: string[]): Promise<number[][] | null> {
    try {
      const replicate = new Replicate({
        auth: this.token,
        useFileOutput: false,
      });

      const output = await withTimeout(
        replicate.run(this.model as `${string}/${string}`, {
          input: {
            texts: JSON.stringify(texts),
            batch_size: MAX_BATCH,
            normalize_embeddings: true,
          },
        }) as Promise<unknown>,
        this.timeoutMs,
      );

      if (!Array.isArray(output) || !Array.isArray(output[0])) {
        this.logger.warn('Replicate returned no embedding matrix');
        return null;
      }
      if (output.length !== texts.length) {
        this.logger.warn(
          `Replicate returned ${output.length} vectors for ${texts.length} texts`,
        );
        return null;
      }
      if (output[0].length !== this.dims) {
        this.logger.error(
          `Embedding model returned ${output[0].length} dims, expected ${this.dims} — ` +
            `set EMBEDDING_DIMS and recreate the Qdrant collection`,
        );
        return null;
      }
      return output as number[][];
    } catch (err) {
      this.logger.error(`Embedding failed: ${String(err)}`);
      return null;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}
