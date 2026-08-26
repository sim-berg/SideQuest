import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import {
  EmitProgressDto,
  ProgressHistoryQueryDto,
  TrackPoolQueryDto,
} from './dto/track.dto.js';
import { ProgressSource } from './enums/track.enums.js';
import { ProgressService } from './progress.service.js';
import { TrackService } from './track.service.js';
import { TrackRewardService } from './track-reward.service.js';

/**
 * Tracks — challenges, story arcs and events.
 *
 * The pool is readable without a login (so the app can show what it offers
 * before sign-up); everything that touches progress requires one.
 */
@Controller('tracks')
export class TrackController {
  constructor(
    private readonly trackService: TrackService,
    private readonly progressService: ProgressService,
    private readonly rewardService: TrackRewardService,
  ) {}

  /** The quest pool: everything on offer, with progress folded in when logged in. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async pool(@Query() query: TrackPoolQueryDto, @Request() req: any) {
    const userId = req.user?.userId ?? null;
    return this.trackService.findPool(userId, {
      kind: query.kind,
      tag: query.tag,
    });
  }

  /** Only what this user accepted — the monitoring view. */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async mine(@Request() req: any) {
    return this.trackService.findMine(req.user.userId);
  }

  /** Raw progress history for the detail view. */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async history(@Query() query: ProgressHistoryQueryDto, @Request() req: any) {
    const events = await this.progressService.history(
      req.user.userId,
      query.metric ?? null,
      query.limit ?? 50,
    );
    return events.map((e) => ({
      metric: e.metric,
      value: e.value,
      source: e.source,
      dayKey: e.dayKey,
      meta: e.meta,
      occurredAt: e.occurredAt.toISOString(),
    }));
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async one(@Param('slug') slug: string, @Request() req: any) {
    return this.trackService.findBySlug(req.user?.userId ?? null, slug);
  }

  /** The "Annehmen" CTA. */
  @Post(':slug/accept')
  @UseGuards(JwtAuthGuard)
  async accept(@Param('slug') slug: string, @Request() req: any) {
    return this.trackService.accept(req.user.userId, slug);
  }

  @Post(':slug/abandon')
  @UseGuards(JwtAuthGuard)
  async abandon(@Param('slug') slug: string, @Request() req: any) {
    return this.trackService.abandon(req.user.userId, slug);
  }

  /**
   * Report progress. Deliberately not scoped to a track — see EmitProgressDto.
   *
   * Returns what moved, so the client can celebrate immediately instead of
   * refetching and diffing.
   */
  @Post('progress')
  @UseGuards(JwtAuthGuard)
  async progress(@Body() dto: EmitProgressDto, @Request() req: any) {
    const result = await this.progressService.emit({
      userId: req.user.userId,
      metric: dto.metric,
      value: dto.value,
      source: dto.source ?? ProgressSource.SELF_REPORT,
      meta: dto.meta,
      dedupeKey: dto.dedupeKey ?? null,
      tzOffsetMinutes: dto.tzOffsetMinutes,
    });

    // Pay out XP, coins and emblems for whatever this event finished.
    const rewards = await this.rewardService.settle(req.user.userId, result);

    return { ...result, rewards };
  }
}
