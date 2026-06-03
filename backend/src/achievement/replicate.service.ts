import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import Replicate from 'replicate';
import type { AchievementDef } from './achievement-catalog.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'achievements');

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

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
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('REPLICATE_API_TOKEN');
    this.model = this.config.get<string>(
      'REPLICATE_MODEL',
      'fofr/sticker-maker',
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

      const res = await fetch(url);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const type = res.headers.get('content-type') ?? 'image/png';
      const ext = EXT_BY_TYPE[type] ?? 'png';
      const buf = Buffer.from(await res.arrayBuffer());
      const file = `${def.key}.${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, file), buf);
      this.logger.log(`Generated AI badge for ${def.key} (${ext})`);
      return this.publicUrl(file);
    } catch (err) {
      this.logger.error(
        `AI badge generation failed for ${def.key}: ${String(err)}`,
      );
      return null;
    }
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
