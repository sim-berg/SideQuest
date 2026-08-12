import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { Category } from '../quest/enums/category.enum.js';
import { Difficulty } from '../quest/enums/difficulty.enum.js';

const OG_DIR = path.join(process.cwd(), 'uploads', 'og');

/** 1.91:1 — what Facebook, WhatsApp, Signal, Telegram and X all expect. */
const WIDTH = 1200;
const HEIGHT = 630;

interface CategoryStyle {
  label: string;
  /** Category color, matching CATEGORY_META in the frontend. */
  accent: string;
}

const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  [Category.SPORT]: { label: 'Sport', accent: '#22c55e' },
  [Category.SOCIAL]: { label: 'Social', accent: '#3b82f6' },
  [Category.ADVENTURE]: { label: 'Abenteuer', accent: '#f59e0b' },
  [Category.SKILL]: { label: 'Skill', accent: '#a855f7' },
  [Category.MYSTERY]: { label: 'Mystery', accent: '#ef4444' },
};

const DIFFICULTY_META: Record<string, { label: string; xp: number }> = {
  [Difficulty.EASY]: { label: 'Leicht', xp: 25 },
  [Difficulty.MEDIUM]: { label: 'Mittel', xp: 50 },
  [Difficulty.HARD]: { label: 'Schwer', xp: 100 },
};

export interface OgCardInput {
  id: string;
  title: string;
  category: Category;
  difficulty: string;
  address: string;
  reward?: number | null;
  isSideQuest?: boolean;
  /** Cache buster — a new value regenerates the card. */
  version: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Greedy word wrap. Widths are estimated from the character count (SVG has no
 * text metrics), which is close enough for a headline in a fixed-width card.
 */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  if (
    lines.length === maxLines &&
    words.join(' ').length > lines.join(' ').length
  ) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, maxChars - 1)}…`;
  }
  return lines;
}

/**
 * Renders the link-preview card shown when a quest URL is shared into a chat
 * app. Cards are rasterised once and cached on disk, so a crawler hitting a
 * popular quest never waits on image work.
 */
@Injectable()
export class OgImageService {
  private readonly logger = new Logger(OgImageService.name);

  async card(input: OgCardInput): Promise<Buffer | null> {
    const file = path.join(OG_DIR, `${input.id}-${input.version}.png`);
    try {
      return await fs.readFile(file);
    } catch {
      // Not cached yet — render it below.
    }

    try {
      const png = await sharp(Buffer.from(this.svg(input)))
        .png()
        .toBuffer();
      await fs.mkdir(OG_DIR, { recursive: true });
      await fs.writeFile(file, png);
      return png;
    } catch (err) {
      // Without a raster the link still previews with title + description.
      this.logger.error(`OG card failed for ${input.id}: ${String(err)}`);
      return null;
    }
  }

  private svg(input: OgCardInput): string {
    const style =
      CATEGORY_STYLE[input.category] ?? CATEGORY_STYLE[Category.ADVENTURE];
    const diff = DIFFICULTY_META[input.difficulty] ?? DIFFICULTY_META.medium;
    const kind = input.isSideQuest ? 'SIDEQUEST' : 'QUEST';

    // Keep the headline clear of the compass motif on the right half.
    const titleLines = wrap(input.title, 18, 3);
    const title = titleLines
      .map(
        (line, i) =>
          `<text x="96" y="${262 + i * 74}" class="title">${escapeXml(line)}</text>`,
      )
      .join('\n  ');
    const belowTitle = 262 + titleLines.length * 74;

    const chips = [
      style.label,
      `${diff.label} · ${diff.xp} XP`,
      ...(input.reward ? [`${input.reward} Coins`] : []),
    ];
    let chipX = 96;
    const chipRow = chips
      .map((label) => {
        // ~16px per character at 28px semibold, plus horizontal padding.
        const width = Math.round(label.length * 16 + 52);
        const chip = `<g>
    <rect x="${chipX}" y="516" rx="32" ry="32" width="${width}" height="64" class="chip"/>
    <text x="${chipX + width / 2}" y="557" class="chip-label">${escapeXml(label)}</text>
  </g>`;
        chipX += width + 18;
        return chip;
      })
      .join('\n  ');

    const addressLine = wrap(input.address, 46, 1)[0] ?? '';
    const address = addressLine
      ? `<text x="96" y="${Math.min(belowTitle + 12, 470)}" class="address">${escapeXml(addressLine)}</text>`
      : '';

    // Same visual language as the app's static og-image.png: indigo night sky,
    // compass on the right, quest details on the left.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e1b4b"/>
      <stop offset="0.55" stop-color="#312e81"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${style.accent}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${style.accent}" stop-opacity="0"/>
    </radialGradient>
    <style>
      text { font-family: "Noto Sans", "DejaVu Sans", sans-serif; fill: #ffffff; }
      .kind { font-size: 28px; font-weight: 700; letter-spacing: 6px; fill: ${style.accent}; }
      .brand { font-size: 30px; font-weight: 800; letter-spacing: -1px; }
      .title { font-size: 60px; font-weight: 800; letter-spacing: -1px; }
      .address { font-size: 28px; fill: #c7d2fe; }
      .chip { fill: #ffffff; fill-opacity: 0.12; stroke: ${style.accent}; stroke-opacity: 0.55; stroke-width: 2; }
      .chip-label { font-size: 28px; font-weight: 600; text-anchor: middle; fill: #e0e7ff; }
    </style>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="960" cy="315" r="300" fill="url(#glow)"/>

  <g transform="translate(960 315)" opacity="0.9">
    <circle r="170" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="3"/>
    <circle r="140" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2"/>
    <g stroke="#ffffff" stroke-opacity="0.32" stroke-width="3" stroke-linecap="round">
      <line x1="0" y1="-170" x2="0" y2="-148"/>
      <line x1="170" y1="0" x2="148" y2="0"/>
      <line x1="0" y1="170" x2="0" y2="148"/>
      <line x1="-170" y1="0" x2="-148" y2="0"/>
    </g>
    <path d="M0 -132 L52 0 L0 132 L-52 0 Z" fill="#ffffff" fill-opacity="0.14"/>
    <path d="M0 -132 L52 0 L0 0 Z" fill="#ffffff"/>
    <path d="M0 132 L-52 0 L0 0 Z" fill="${style.accent}"/>
    <circle r="17" fill="#0f172a" stroke="#ffffff" stroke-width="5"/>
  </g>

  <text x="96" y="96" class="brand">SideQuest</text>
  <text x="96" y="160" class="kind">${kind}</text>
  ${title}
  ${address}
  ${chipRow}
</svg>`;
  }
}
