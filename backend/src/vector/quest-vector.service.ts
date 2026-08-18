import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import { EmbeddingService } from './embedding.service.js';
import { QdrantHit, QdrantPoint, QdrantService } from './qdrant.service.js';
import {
  buildFilter,
  buildText,
  objectIdFromPointId,
  pointId,
  type QuestSearchOptions,
} from './vector.helpers.js';

export type { QuestSearchOptions } from './vector.helpers.js';

/** Qdrant payload field → index type. Everything we pre-filter on. */
const PAYLOAD_INDEXES: Record<string, string> = {
  location: 'geo',
  category: 'keyword',
  type: 'keyword',
  isSideQuest: 'bool',
  completed: 'bool',
  expiresAt: 'integer',
  createdBy: 'keyword',
};

/**
 * Bump whenever `buildText` or `payloadFor` changes shape.
 *
 * `updatedAt` cannot see a code change, so without this a deploy that alters
 * what gets embedded would leave every existing quest sitting in the index
 * with a vector built from the old rules — silently, and forever. The sweep
 * re-queues anything stamped with an older version.
 *
 * v2: dropped the "Kategorie:" line from the embedded text.
 */
const INDEX_VERSION = 2;

/** Quests re-indexed per reconcile tick. Bounds both API cost and latency. */
const RECONCILE_BATCH = 50;

/** Every Nth tick also diffs Mongo against Qdrant in both directions. */
const SWEEP_EVERY_N_TICKS = 30;

/**
 * Refuse to delete when this share of the scanned points looks orphaned.
 * A sweep that wants to drop most of the index is not finding stale points —
 * it is pointed at the wrong database or collection, and the safe move is to
 * shout instead of emptying the index. Small collections are exempt: with
 * five points, "most of them" means nothing.
 */
const SWEEP_MAX_ORPHAN_RATIO = 0.5;
const SWEEP_RATIO_MIN_POINTS = 25;

export interface QuestVectorHit {
  questId: string;
  score: number;
  payload: Record<string, unknown>;
}

/**
 * Keeps every Quest document mirrored in Qdrant as an embedding.
 *
 * The guarantee is "eventually indexed, always", and it comes from a
 * reconciler rather than from remembering to call this service at every write
 * site: `vectorAt < updatedAt` marks a quest dirty, and Mongoose bumps
 * `updatedAt` on every save. Write sites additionally call `indexNow()` so a
 * fresh quest is searchable in seconds instead of on the next tick — but
 * forgetting that call costs latency, never correctness.
 */
@Injectable()
export class QuestVectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuestVectorService.name);
  private readonly collection: string;
  private readonly intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private ready = false;
  private running = false;
  private ticks = 0;

  constructor(
    @InjectModel(Quest.name) private readonly questModel: Model<QuestDocument>,
    private readonly qdrant: QdrantService,
    private readonly embeddings: EmbeddingService,
    private readonly config: ConfigService,
  ) {
    this.collection = this.config.get<string>('QDRANT_COLLECTION', 'quests');
    this.intervalMs = Number(
      this.config.get<string>('VECTOR_RECONCILE_INTERVAL_MS', '30000'),
    );
  }

  get enabled(): boolean {
    return this.qdrant.enabled && this.embeddings.enabled;
  }

  async onModuleInit(): Promise<void> {
    if (!this.qdrant.enabled) {
      this.logger.warn('QDRANT_URL not set — quest vector search disabled');
      return;
    }
    if (!this.embeddings.enabled) {
      this.logger.warn(
        'REPLICATE_API_TOKEN not set — quest embeddings disabled',
      );
      return;
    }

    this.ready = await this.qdrant.ensureCollection(
      this.collection,
      this.embeddings.dims,
      PAYLOAD_INDEXES,
    );
    if (!this.ready) {
      this.logger.error(
        'Qdrant collection unavailable — retrying on the next tick',
      );
    }

    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    // Don't hold the event loop open for a background reconciler.
    this.timer.unref?.();
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // --- Indexing -----------------------------------------------------------

  /**
   * Index a quest right away, best-effort. Fire-and-forget from write paths:
   * anything that fails here is picked up by the next reconcile tick.
   */
  async indexNow(quest: QuestDocument): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.indexBatch([quest]);
    } catch (err) {
      this.logger.error(
        `indexNow failed for ${quest._id.toString()}: ${String(err)}`,
      );
    }
  }

  /** Drop quests from the index — call whenever quests are hard-deleted. */
  async removeQuests(ids: string[]): Promise<void> {
    if (!this.enabled || ids.length === 0) return;
    await this.qdrant.deletePoints(this.collection, ids.map(pointId));
  }

  /** One reconcile pass: index what's dirty, then occasionally sweep orphans. */
  private async tick(): Promise<void> {
    if (!this.enabled || this.running) return;
    this.running = true;
    try {
      if (!this.ready) {
        this.ready = await this.qdrant.ensureCollection(
          this.collection,
          this.embeddings.dims,
          PAYLOAD_INDEXES,
        );
        if (!this.ready) return;
      }

      const dirty = await this.questModel
        .find({
          $or: [
            { vectorAt: null },
            { $expr: { $lt: ['$vectorAt', '$updatedAt'] } },
          ],
        })
        .sort({ updatedAt: 1 })
        .limit(RECONCILE_BATCH)
        .exec();

      if (dirty.length > 0) {
        const indexed = await this.indexBatch(dirty);
        this.logger.log(
          `Indexed ${indexed}/${dirty.length} quest(s) into "${this.collection}"`,
        );
      }

      if (this.ticks++ % SWEEP_EVERY_N_TICKS === 0) await this.sweep();
    } catch (err) {
      this.logger.error(`Reconcile tick failed: ${String(err)}`);
    } finally {
      this.running = false;
    }
  }

  /** Embed + upsert a batch, then mark the quests clean. Returns the count. */
  private async indexBatch(quests: QuestDocument[]): Promise<number> {
    const texts = quests.map((q) => embeddingText(q));
    const vectors = await this.embeddings.embedPassages(texts);

    const points: QdrantPoint[] = [];
    const indexed: { quest: QuestDocument; hash: string }[] = [];

    quests.forEach((quest, i) => {
      const vector = vectors[i];
      // No vector → stays dirty and is retried, rather than being indexed wrong.
      if (!vector) return;
      points.push({
        id: pointId(quest._id.toString()),
        vector,
        payload: payloadFor(quest),
      });
      indexed.push({ quest, hash: contentHash(quest) });
    });

    if (points.length === 0) return 0;
    if (!(await this.qdrant.upsert(this.collection, points))) {
      // The collection can disappear underneath us (dropped by hand, restored
      // from a snapshot). Re-run ensureCollection before the next attempt
      // instead of writing into the void until someone restarts the process.
      this.ready = false;
      return 0;
    }

    // Mark clean without touching updatedAt — otherwise every index would
    // dirty the document again and the reconciler would never settle. The
    // updatedAt guard keeps a quest dirty when it changed mid-flight.
    await Promise.all(
      indexed.map(({ quest, hash }) =>
        this.questModel
          .updateOne(
            { _id: quest._id, updatedAt: quest.updatedAt },
            { $set: { vectorAt: new Date(), vectorHash: hash } },
            { timestamps: false },
          )
          .exec(),
      ),
    );
    return points.length;
  }

  /**
   * Full two-way diff between Mongo and Qdrant.
   *
   * `vectorAt` is only Mongo's *claim* about what Qdrant holds, and the two can
   * drift apart for reasons no write path sees: a restored snapshot, a manual
   * delete, a collection someone dropped. So this compares the actual id sets:
   *  - point without a quest  → delete it (despawned side quests)
   *  - quest without a point  → mark it dirty so the next tick re-indexes it
   * Without the second direction a lost point would stay lost forever, because
   * the quest still looks clean.
   */
  private async sweep(): Promise<void> {
    const pointIds = new Set<string>();
    let offset: string | number | null = null;

    do {
      const page = await this.qdrant.scrollIds(this.collection, 1024, offset);
      if (!page) {
        // Scroll failed — the collection may be gone. Re-ensure next tick
        // rather than acting on a half-read view of the index.
        this.ready = false;
        return;
      }
      for (const id of page.ids) pointIds.add(id);
      offset = page.next;
    } while (offset);

    const quests = await this.questModel
      .find({}, { _id: 1, vectorAt: 1, vectorHash: 1 })
      .lean()
      .exec();
    const questPointIds = new Set(quests.map((q) => pointId(String(q._id))));

    // Direction 1: points with no quest behind them.
    const orphans = [...pointIds].filter((id) => !questPointIds.has(id));
    const ratio = pointIds.size > 0 ? orphans.length / pointIds.size : 0;
    const suspicious =
      pointIds.size >= SWEEP_RATIO_MIN_POINTS && ratio > SWEEP_MAX_ORPHAN_RATIO;

    if (suspicious) {
      this.logger.error(
        `Sweep aborted: ${orphans.length}/${pointIds.size} points have no quest ` +
          `in ${this.questModel.db.name}. That looks like the wrong database or ` +
          `a collection shared with another environment — set QDRANT_COLLECTION ` +
          `to something unique instead. Nothing was deleted.`,
      );
    } else if (orphans.length > 0) {
      await this.qdrant.deletePoints(this.collection, orphans);
      this.logger.log(`Swept ${orphans.length} orphaned point(s) from Qdrant`);
    }

    // Direction 2: quests that need to go back into the queue, either because
    // the index has no point for them, or because they were indexed by an
    // older INDEX_VERSION — a deploy that changes the embedded text has to
    // refresh existing vectors, and `updatedAt` never moves for that.
    // Deliberately ignores `vectorAt`: that flag is only a claim, and this is
    // the one place that checks the index itself.
    const stale = quests.filter(
      (q) =>
        !pointIds.has(pointId(String(q._id))) ||
        !q.vectorHash?.startsWith(`${INDEX_VERSION}:`),
    );

    if (stale.length > 0) {
      await this.questModel
        .updateMany(
          { _id: { $in: stale.map((q) => q._id) } },
          { $set: { vectorAt: null, vectorHash: null } },
          { timestamps: false },
        )
        .exec();
      this.logger.warn(
        `${stale.length} quest(s) stale or missing in "${this.collection}" — queued for re-indexing`,
      );
    }
  }

  // --- Retrieval ----------------------------------------------------------

  /** Semantic search. Returns [] when the vector stack is unavailable. */
  async search(
    query: string,
    opts: QuestSearchOptions = {},
  ): Promise<QuestVectorHit[]> {
    if (!this.enabled || !this.ready || !query.trim()) return [];
    const vector = await this.embeddings.embedQuery(query.trim());
    if (!vector) return [];
    return this.queryWith(vector, opts);
  }

  /** Quests similar to an existing one — reuses its stored vector. */
  async similar(
    quest: QuestDocument,
    opts: QuestSearchOptions = {},
  ): Promise<QuestVectorHit[]> {
    if (!this.enabled || !this.ready) return [];
    const vector = (
      await this.embeddings.embedPassages([embeddingText(quest)])
    )[0];
    if (!vector) return [];

    const self = quest._id.toString();
    const hits = await this.queryWith(vector, {
      ...opts,
      limit: (opts.limit ?? 5) + 1,
    });
    return hits.filter((h) => h.questId !== self).slice(0, opts.limit ?? 5);
  }

  /**
   * Nearest existing quest above `threshold` within `radiusM` meters — the
   * near-duplicate check for newly posted quests. Returns null when nothing is
   * close enough, or when the vector stack can't answer in time (a slow
   * embedding must never block someone from posting a quest).
   */
  async findNearDuplicate(
    title: string,
    description: string,
    address: string,
    lat: number,
    lng: number,
    opts: { radiusM: number; threshold: number; timeoutMs: number },
  ): Promise<QuestVectorHit | null> {
    if (!this.enabled || !this.ready) return null;

    const text = buildText({ title, description, address });
    const lookup = (async () => {
      const vector = (await this.embeddings.embedPassages([text]))[0];
      if (!vector) return null;
      const hits = await this.queryWith(vector, {
        limit: 1,
        lat,
        lng,
        radius: opts.radiusM / 1000,
        includeSideQuests: false,
        scoreThreshold: opts.threshold,
      });
      return hits[0] ?? null;
    })();

    return Promise.race([
      lookup,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), opts.timeoutMs),
      ),
    ]).catch(() => null);
  }

  private async queryWith(
    vector: number[],
    opts: QuestSearchOptions,
  ): Promise<QuestVectorHit[]> {
    const hits: QdrantHit[] = await this.qdrant.query(this.collection, {
      vector,
      limit: opts.limit ?? 20,
      filter: buildFilter(opts),
      scoreThreshold: opts.scoreThreshold,
    });
    return hits.map((h) => {
      // The payload carries the quest id, but the point id encodes it too —
      // fall back to that rather than dropping an otherwise good hit.
      const fromPayload = h.payload?.questId;
      return {
        questId:
          typeof fromPayload === 'string'
            ? fromPayload
            : objectIdFromPointId(h.id),
        score: h.score,
        payload: h.payload ?? {},
      };
    });
  }

  /** Index health for the /api/health/vector endpoint. */
  async stats() {
    const pending = this.enabled
      ? await this.questModel
          .countDocuments({
            $or: [
              { vectorAt: null },
              { $expr: { $lt: ['$vectorAt', '$updatedAt'] } },
            ],
          })
          .exec()
      : null;

    return {
      enabled: this.enabled,
      ready: this.ready,
      collection: this.collection,
      dims: this.embeddings.dims,
      qdrantConfigured: this.qdrant.enabled,
      embeddingsConfigured: this.embeddings.enabled,
      indexedPoints: this.ready
        ? await this.qdrant.count(this.collection)
        : null,
      pendingQuests: pending,
      quests: await this.questModel.estimatedDocumentCount().exec(),
    };
  }
}

// --- Pure helpers ---------------------------------------------------------

/**
 * The text that actually gets embedded: title, description, place name.
 *
 * The category is deliberately *not* in here. A labelled enum line
 * ("Kategorie: sport") reads as near-identical boilerplate across every quest
 * and measurably flattened the ranking — with it, "ich will mich richtig
 * auspowern" ranked "Erkunde die Karte" above "Mach 10 Kniebeugen!"; without
 * it, the squats win. Category is a payload filter, not meaning.
 */
function embeddingText(quest: QuestDocument): string {
  return buildText({
    title: quest.title,
    description: quest.description,
    address: quest.address,
  });
}

function payloadFor(quest: QuestDocument): Record<string, unknown> {
  return {
    questId: quest._id.toString(),
    title: quest.title,
    description: quest.description,
    category: quest.category,
    type: quest.type ?? 'personal',
    difficulty: quest.difficulty ?? 'medium',
    isSideQuest: !!quest.isSideQuest,
    completed: !!quest.completedBy,
    accepted: !!quest.acceptedBy,
    reward: quest.reward ?? 0,
    createdBy: quest.createdBy ?? '',
    // Qdrant range filters need numbers; 0 stands for "never expires".
    expiresAt: quest.expiresAt
      ? Math.floor(quest.expiresAt.getTime() / 1000)
      : 0,
    createdAt: quest.createdAt
      ? Math.floor(quest.createdAt.getTime() / 1000)
      : 0,
    location: { lat: quest.lat, lon: quest.lng },
  };
}

/** Everything that, when changed, must produce a new index entry. */
function contentHash(quest: QuestDocument): string {
  const hash = createHash('sha256')
    .update(JSON.stringify([embeddingText(quest), payloadFor(quest)]))
    .digest('hex');
  // Version-prefixed so the sweep can spot vectors built by older rules.
  return `${INDEX_VERSION}:${hash}`;
}
