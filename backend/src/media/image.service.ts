import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import Replicate from 'replicate';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

/** Extensions we may have cached for a key, newest format first. */
const CACHE_EXTS = ['png', 'webp', 'jpg', 'svg'];

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

/** Shape of the deterministic no-network fallback image. */
export type FallbackShape = 'badge' | 'scene';

export interface ImageRequest {
  /** Sub-directory under uploads/ — one bucket per kind of image. */
  bucket: string;
  /** Stable cache key; the same key always resolves to the same file. */
  key: string;
  prompt: string;
  /** Replicate model slug (with pinned version for community models). */
  model?: string;
  aspectRatio?: string;
  /** Regenerate even if a cached file exists. */
  force?: boolean;
  /** Drawn when Replicate is unavailable or fails. */
  fallback: {
    emoji: string;
    /** Gradient endpoints — a single color is fine, it gets doubled. */
    colors: [string, string] | [string];
    shape?: FallbackShape;
  };
}

export interface GeneratedImage {
  url: string;
  /** Where the returned image came from — useful for logging and tests. */
  source: 'cache' | 'ai' | 'fallback';
}

/**
 * One place to turn a prompt into a stored image URL.
 *
 * Every image is cached on disk under `uploads/<bucket>/<key>.<ext>` and served
 * statically at `/uploads`, so repeat requests never hit Replicate. Output is
 * PNG (transparency survives, which badge-style art needs). Without a
 * REPLICATE_API_TOKEN — or on any generation failure — a deterministic SVG is
 * written instead, so callers always get a usable URL and never an error.
 */
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly token?: string;
  private readonly defaultModel: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('REPLICATE_API_TOKEN');
    // Community models need a pinned version — the version-less endpoint
    // only exists for official models (404 otherwise).
    this.defaultModel = this.config.get<string>(
      'REPLICATE_MODEL',
      'fofr/sticker-maker:4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a',
    );
    this.appUrl = this.config
      .get<string>('APP_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  /**
   * Resolve a prompt to a stored image URL: cache → Replicate → SVG fallback.
   * Never throws.
   */
  async generate(req: ImageRequest): Promise<GeneratedImage> {
    const dir = this.bucketDir(req.bucket);
    await fs.mkdir(dir, { recursive: true });

    if (!req.force) {
      const cached = await this.findCached(dir, req.key);
      if (cached)
        return { url: this.publicUrl(req.bucket, cached), source: 'cache' };
    }

    if (this.token) {
      const file = await this.generateAi(dir, req);
      if (file) {
        // Drop stale variants with another extension so a later cache lookup
        // can't resurrect the old picture.
        await this.clearCachedExcept(dir, req.key, file);
        return { url: this.publicUrl(req.bucket, file), source: 'ai' };
      }
    }

    const file = await this.writeFallback(dir, req);
    return { url: this.publicUrl(req.bucket, file), source: 'fallback' };
  }

  /**
   * Write only the instant SVG fallback, skipping Replicate entirely. Use this
   * when a caller needs a URL right now and upgrades to AI art in the
   * background (see `generate` with `force: true`).
   */
  async generateFallbackOnly(req: ImageRequest): Promise<GeneratedImage> {
    const dir = this.bucketDir(req.bucket);
    await fs.mkdir(dir, { recursive: true });
    const file = await this.writeFallback(dir, req);
    return { url: this.publicUrl(req.bucket, file), source: 'fallback' };
  }

  private bucketDir(bucket: string): string {
    // Keep buckets inside uploads/ — a key or bucket must never escape it.
    return path.join(UPLOAD_ROOT, bucket.replace(/[^a-z0-9_-]/gi, ''));
  }

  private publicUrl(bucket: string, file: string): string {
    return `${this.appUrl}/uploads/${bucket}/${file}`;
  }

  /** Returns the generated PNG's filename, or null if generation failed. */
  private async generateAi(
    dir: string,
    req: ImageRequest,
  ): Promise<string | null> {
    try {
      const replicate = new Replicate({
        auth: this.token,
        useFileOutput: false,
      });
      const model = (req.model ?? this.defaultModel) as `${string}/${string}`;
      const output = (await replicate.run(model, {
        input: {
          prompt: req.prompt,
          output_format: 'png',
          ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
        },
      })) as unknown;

      const url = this.firstUrl(output);
      if (!url) {
        this.logger.warn(
          `Replicate returned no URL for ${req.bucket}/${req.key}`,
        );
        return null;
      }
      const file = await this.download(dir, req.key, url);
      this.logger.log(`Generated image ${req.bucket}/${file}`);
      return file;
    } catch (err) {
      this.logger.error(
        `Image generation failed for ${req.bucket}/${req.key}: ${String(err)}`,
      );
      return null;
    }
  }

  private async writeFallback(dir: string, req: ImageRequest): Promise<string> {
    const file = `${req.key}.svg`;
    const [c1, c2 = c1] = req.fallback.colors;
    const svg =
      req.fallback.shape === 'scene'
        ? this.sceneSvg(req.fallback.emoji, c1, c2)
        : this.badgeSvg(req.fallback.emoji, c1, c2);
    await fs.writeFile(path.join(dir, file), svg, 'utf8');
    return file;
  }

  private async findCached(dir: string, key: string): Promise<string | null> {
    for (const ext of CACHE_EXTS) {
      const file = `${key}.${ext}`;
      try {
        await fs.access(path.join(dir, file));
        return file;
      } catch {
        /* not cached with this extension */
      }
    }
    return null;
  }

  private async clearCachedExcept(
    dir: string,
    key: string,
    keep: string,
  ): Promise<void> {
    for (const ext of CACHE_EXTS) {
      const file = `${key}.${ext}`;
      if (file === keep) continue;
      await fs.rm(path.join(dir, file), { force: true });
    }
  }

  private async download(
    dir: string,
    key: string,
    url: string,
  ): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const type = res.headers.get('content-type') ?? 'image/png';
    const ext = EXT_BY_TYPE[type] ?? 'png';
    const buf = Buffer.from(await res.arrayBuffer());
    const file = `${key}.${ext}`;
    await fs.writeFile(path.join(dir, file), buf);
    return file;
  }

  /** Normalize the many possible Replicate output shapes to a single URL. */
  private firstUrl(output: unknown): string | null {
    if (!output) return null;
    if (typeof output === 'string') return output;
    if (Array.isArray(output)) {
      for (const item of output) {
        const u = this.firstUrl(item);
        if (u) return u;
      }
      return null;
    }
    if (typeof output === 'object') {
      const o = output as Record<string, unknown>;
      if (typeof o.url === 'string') return o.url;
      if (typeof o.url === 'function') {
        try {
          return String((o.url as () => unknown)());
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private badgeSvg(emoji: string, c1: string, c2: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${c2}" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${c2}" flood-opacity="0.45"/>
    </filter>
  </defs>
  <circle cx="128" cy="128" r="104" fill="url(#g)" stroke="#fff" stroke-width="8" filter="url(#s)"/>
  <circle cx="128" cy="128" r="84" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="6 8"/>
  <text x="128" y="150" font-size="88" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
</svg>`;
  }

  private sceneSvg(emoji: string, c1: string, c2: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <text x="320" y="186" font-size="150" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>`;
  }
}
