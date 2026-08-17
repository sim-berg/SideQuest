import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { SoulService } from './soul.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CATEGORY_ELEMENT_AFFINITY, ELEMENTS } from './pet-catalog.js';
import { Element } from './enums/element.enum.js';
import { Category } from '../quest/enums/category.enum.js';

/**
 * The user's soul: the LLM-written soul.md plus a structured view derived
 * from completed quests — category counts and the element affinity they
 * feed (the same mapping that biases egg hatching). Lives in the pet
 * module because SoulService does, but answers under /users.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class SoulController {
  constructor(private readonly soulService: SoulService) {}

  @Get('me/soul')
  async getMySoul(@Request() req: any) {
    const userId = req.user.userId as string;
    const [content, stats] = await Promise.all([
      this.soulService.getUserSoulContent(userId),
      this.soulService.collectUserStats(userId),
    ]);

    // Every completed quest of a category strengthens its affine elements.
    const elementScores: Record<string, number> = {};
    for (const [category, count] of Object.entries(stats.categoryCounts)) {
      const affine = CATEGORY_ELEMENT_AFFINITY[category as Category] ?? [];
      for (const element of affine) {
        elementScores[element] = (elementScores[element] ?? 0) + count;
      }
    }
    const dominant = Object.entries(elementScores).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      content,
      questsCompleted: stats.questsCompleted,
      dailyStreak: stats.dailyStreak,
      longestDailyStreak: stats.longestDailyStreak,
      categoryCounts: stats.categoryCounts,
      elementScores,
      dominantElement: dominant
        ? {
            id: dominant[0],
            score: dominant[1],
            name: ELEMENTS[dominant[0] as Element]?.name ?? dominant[0],
            emoji: ELEMENTS[dominant[0] as Element]?.emoji ?? '✨',
            color: ELEMENTS[dominant[0] as Element]?.color ?? '#94a3b8',
          }
        : null,
    };
  }
}
