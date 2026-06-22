import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import Replicate from 'replicate';
import type { AchievementDef } from './achievement-catalog.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'achievements');
const SCENE_DIR = path.join(process.cwd(), 'uploads', 'sidequests');

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

const CACHE_EXTS = ['png', 'webp', 'jpg'];

/** Describes a side quest scene to illustrate (vs. an achievement badge). */
export interface SceneInput {
  /** Stable cache key — same key reuses the same generated image. */
  key: string;
  prompt: string;
  emoji: string;
  /** Two hex colors for the fallback gradient. */
  colors: [string, string];
}

/**
 * Generates achievement badge images.
 *  - With REPLICATE_API_TOKEN: a transparent sticker PNG via Replicate.
 *  - Without (or on any failure): a deterministic transparent SVG badge.
 * Both are written under backend/uploads/achievements and served at /uploads.
 */
@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private readonly token?: string;
  private readonly model: string;
  private readonly sceneModel: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('REPLICATE_API_TOKEN');
    this.model = this.config.get<string>(
      'REPLICATE_MODEL',
      'fofr/sticker-maker',
    );
    // A general text-to-image model for illustrative side quest scenes.
    this.sceneModel = this.config.get<string>(
      'REPLICATE_SCENE_MODEL',
      'black-forest-labs/flux-schnell',
    );
    this.appUrl = this.config
      .get<string>('APP_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  private publicUrl(file: string): string {
    return `${this.appUrl}/uploads/achievements/${file}`;
  }

  /** Always-available transparent SVG badge. Fast, no network. */
  async generateFallback(def: AchievementDef): Promise<string> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const file = `${def.key}.svg`;
    const svg = this.badgeSvg(def);
    await fs.writeFile(path.join(UPLOAD_DIR, file), svg, 'utf8');
    return this.publicUrl(file);
  }

  /**
   * Transparent PNG via Replicate. Returns the absolute URL, or null if no
   * token is set or generation fails (caller keeps the fallback).
   */
  async generateAi(def: AchievementDef): Promise<string | null> {
    if (!this.token) return null;
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const replicate = new Replicate({
        auth: this.token,
        useFileOutput: false,
      });
      const output = (await replicate.run(this.model as `${string}/${string}`, {
        input: {
          prompt: def.prompt,
          steps: 17,
          output_format: 'png',
        },
      })) as unknown;

      const url = this.firstUrl(output);
      if (!url) {
        this.logger.warn(`Replicate returned no URL for ${def.key}`);
        return null;
      }

      const file = await this.download(UPLOAD_DIR, def.key, url);
      this.logger.log(`Generated AI badge for ${def.key}`);
      return this.publicUrl(file);
    } catch (err) {
      this.logger.error(
        `AI badge generation failed for ${def.key}: ${String(err)}`,
      );
      return null;
    }
  }

  /**
   * Illustrative scene image for a side quest. Tries Replicate (cached on disk
   * by key, so repeated requests are instant), and falls back to a colorful
   * inline gradient SVG when no token is set or generation fails — so the
   * detail modal always has something vivid to show.
   */
  async generateScene(scene: SceneInput): Promise<string> {
    await fs.mkdir(SCENE_DIR, { recursive: true });

    const cached = await this.findCached(SCENE_DIR, scene.key);
    if (cached) return this.sceneUrl(cached);

    if (this.token) {
      try {
        const replicate = new Replicate({
          auth: this.token,
          useFileOutput: false,
        });
        const output = (await replicate.run(
          this.sceneModel as `${string}/${string}`,
          {
            input: {
              prompt: scene.prompt,
              aspect_ratio: '16:9',
              output_format: 'webp',
            },
          },
        )) as unknown;

        const url = this.firstUrl(output);
        if (url) {
          const file = await this.download(SCENE_DIR, scene.key, url);
          this.logger.log(`Generated AI scene for ${scene.key}`);
          return this.sceneUrl(file);
        }
        this.logger.warn(`Replicate returned no URL for scene ${scene.key}`);
      } catch (err) {
        this.logger.error(
          `AI scene generation failed for ${scene.key}: ${String(err)}`,
        );
      }
    }

    return this.sceneFallback(scene);
  }

  private sceneUrl(file: string): string {
    return `${this.appUrl}/uploads/sidequests/${file}`;
  }

  /** Returns the cached image filename for a key, or null if none exists. */
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

  /** Download a remote image into `dir` as `<key>.<ext>` and return the name. */
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

  /** Inline, no-network colorful gradient scene used as the fallback image. */
  private sceneFallback(scene: SceneInput): string {
    const svg = this.sceneSvg(scene);
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  private sceneSvg(scene: SceneInput): string {
    const [c1, c2] = scene.colors;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect width="640" height="360" fill="url(#glow)"/>
  <g fill="#ffffff">
    <circle cx="92" cy="70" r="3.5" opacity="0.9"/>
    <circle cx="548" cy="96" r="2.5" opacity="0.8"/>
    <circle cx="120" cy="290" r="2.5" opacity="0.7"/>
    <circle cx="500" cy="280" r="3" opacity="0.85"/>
    <circle cx="320" cy="56" r="2" opacity="0.7"/>
  </g>
  <text x="320" y="186" font-size="150" text-anchor="middle" dominant-baseline="central">${scene.emoji}</text>
  <text x="320" y="300" font-size="34" text-anchor="middle" dominant-baseline="central" opacity="0.85">✦ ✧ ✦</text>
</svg>`;
  }

  private badgeSvg(def: AchievementDef): string {
    const c = def.color;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${c}" flood-opacity="0.45"/>
    </filter>
  </defs>
  <circle cx="128" cy="128" r="104" fill="url(#g)" stroke="#fff" stroke-width="8" filter="url(#s)"/>
  <circle cx="128" cy="128" r="84" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="6 8"/>
  <text x="128" y="150" font-size="88" text-anchor="middle" dominant-baseline="middle">${def.emoji}</text>
</svg>`;
  }
}
