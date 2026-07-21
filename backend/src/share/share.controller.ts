import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quest, QuestDocument } from '../quest/schemas/quest.schema.js';
import { OgImageService } from './og-image.service.js';

const OBJECT_ID_RE = /([0-9a-f]{24})$/;

/** Mirrors the frontend's `idFromSlug` — the id is the slug's last segment. */
function idFromSlug(slug: string): string | null {
  return slug.match(OBJECT_ID_RE)?.[1] ?? null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/**
 * Link previews for shared quests.
 *
 * WhatsApp, Signal, Telegram, Facebook, X and friends never run the SPA's
 * JavaScript — they read the first response's `<head>`. nginx routes crawler
 * requests for /quest/:slug here so they get real per-quest Open Graph tags,
 * while humans keep getting the app shell.
 */
@Controller('share')
export class ShareController {
  constructor(
    @InjectModel(Quest.name) private readonly questModel: Model<QuestDocument>,
    private readonly config: ConfigService,
    private readonly ogImage: OgImageService,
  ) {}

  private get appUrl(): string {
    return this.config
      .get<string>('APP_URL', 'http://localhost:5173')
      .replace(/\/$/, '');
  }

  private async findBySlug(slug: string): Promise<QuestDocument> {
    const id = idFromSlug(slug);
    const doc = id ? await this.questModel.findById(id).exec() : null;
    if (!doc) throw new NotFoundException(`Quest ${slug} not found`);
    return doc;
  }

  @Get('quest/:slug')
  async questPreview(
    @Param('slug') slug: string,
    @Res() res: Response,
  ): Promise<void> {
    const quest = await this.findBySlug(slug);

    const url = `${this.appUrl}/quest/${slug}`;
    const image = `${this.appUrl}/api/share/quest/${slug}/image.png`;
    const title = truncate(quest.title, 70);
    const description = truncate(quest.description, 200);

    res.type('html').send(`<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} · SideQuest</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="SideQuest">
<meta property="og:type" content="article">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<link rel="canonical" href="${escapeHtml(url)}">
</head>
<body>
<p><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></p>
</body>
</html>`);
  }

  @Get('quest/:slug/image.png')
  async questImage(
    @Param('slug') slug: string,
    @Res() res: Response,
  ): Promise<void> {
    const quest = await this.findBySlug(slug);

    const png = await this.ogImage.card({
      id: quest._id.toString(),
      title: quest.title,
      category: quest.category,
      difficulty: quest.difficulty,
      address: quest.address,
      reward: quest.reward,
      isSideQuest: quest.isSideQuest,
      version: String(quest.updatedAt?.getTime() ?? 0),
    });

    if (!png) throw new NotFoundException('Preview image unavailable');

    res.type('png').set('Cache-Control', 'public, max-age=86400').send(png);
  }
}
