import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface QdrantHit {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

/** Qdrant filter clause — kept loose on purpose, the DSL is large. */
export type QdrantFilter = Record<string, unknown>;

export interface QuerySpec {
  vector: number[];
  limit: number;
  filter?: QdrantFilter;
  scoreThreshold?: number;
}

/**
 * Minimal Qdrant REST client.
 *
 * Deliberately hand-rolled over `fetch` instead of pulling in the official
 * SDK: we use six endpoints, the wire format is stable, and this keeps the
 * production image free of another dependency tree.
 *
 * Every method degrades instead of throwing — when QDRANT_URL is unset or the
 * service is down, indexing stays pending and search falls back to Mongo.
 */
@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('QDRANT_URL', '').replace(/\/$/, '');
    this.apiKey = this.config.get<string>('QDRANT_API_KEY') || undefined;
    this.timeoutMs = Number(
      this.config.get<string>('QDRANT_TIMEOUT_MS', '10000'),
    );
  }

  get enabled(): boolean {
    return !!this.baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T | null> {
    if (!this.enabled) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { 'api-key': this.apiKey } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(
          `${method} ${path} → ${res.status} ${detail.slice(0, 300)}`,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.error(`Qdrant ${method} ${path} failed: ${String(err)}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** True once Qdrant answers — used to gate the indexer on boot. */
  async healthy(): Promise<boolean> {
    if (!this.enabled) return false;
    const res = await this.request<{ title?: string }>('GET', '/');
    return res !== null;
  }

  /**
   * Create the collection and its payload indexes if they don't exist yet.
   * Idempotent, so it can run on every boot.
   */
  async ensureCollection(
    name: string,
    dims: number,
    payloadIndexes: Record<string, string>,
  ): Promise<boolean> {
    if (!this.enabled) return false;

    const existing = await this.getCollection(name);
    if (existing) {
      const size = existing.result?.config?.params?.vectors?.size;
      if (size && size !== dims) {
        this.logger.error(
          `Collection "${name}" has ${size} dims but the embedding model ` +
            `produces ${dims}. Drop the collection or point QDRANT_COLLECTION ` +
            `at a new name — indexing stays disabled until then.`,
        );
        return false;
      }
    } else {
      const created = await this.request('PUT', `/collections/${name}`, {
        vectors: { size: dims, distance: 'Cosine' },
      });
      if (created === null) return false;
      this.logger.log(`Created Qdrant collection "${name}" (${dims} dims)`);
    }

    // Payload indexes make the geo/category pre-filters cheap. Re-creating an
    // existing index is a no-op for Qdrant.
    for (const [field, schema] of Object.entries(payloadIndexes)) {
      await this.request('PUT', `/collections/${name}/index?wait=true`, {
        field_name: field,
        field_schema: schema,
      });
    }
    return true;
  }

  private getCollection(name: string) {
    return this.request<{
      result?: { config?: { params?: { vectors?: { size?: number } } } };
    }>('GET', `/collections/${name}`);
  }

  async upsert(name: string, points: QdrantPoint[]): Promise<boolean> {
    if (points.length === 0) return true;
    const res = await this.request(
      'PUT',
      `/collections/${name}/points?wait=true`,
      {
        points,
      },
    );
    return res !== null;
  }

  async deletePoints(name: string, ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    const res = await this.request(
      'POST',
      `/collections/${name}/points/delete?wait=true`,
      { points: ids },
    );
    return res !== null;
  }

  async query(name: string, spec: QuerySpec): Promise<QdrantHit[]> {
    const res = await this.request<{ result?: { points?: QdrantHit[] } }>(
      'POST',
      `/collections/${name}/points/query`,
      {
        query: spec.vector,
        limit: spec.limit,
        filter: spec.filter,
        score_threshold: spec.scoreThreshold,
        with_payload: true,
      },
    );
    return res?.result?.points ?? [];
  }

  /** One page of point ids. `offset` is the previous page's next_page_offset. */
  async scrollIds(
    name: string,
    limit: number,
    offset?: string | number | null,
  ): Promise<{ ids: string[]; next: string | number | null } | null> {
    const res = await this.request<{
      result?: {
        points?: { id: string }[];
        next_page_offset?: string | number | null;
      };
    }>('POST', `/collections/${name}/points/scroll`, {
      limit,
      offset: offset ?? undefined,
      with_payload: false,
      with_vector: false,
    });
    if (!res) return null;
    return {
      ids: (res.result?.points ?? []).map((p) => String(p.id)),
      next: res.result?.next_page_offset ?? null,
    };
  }

  async count(name: string): Promise<number | null> {
    const res = await this.request<{ result?: { count?: number } }>(
      'POST',
      `/collections/${name}/points/count`,
      { exact: true },
    );
    return res?.result?.count ?? null;
  }
}
