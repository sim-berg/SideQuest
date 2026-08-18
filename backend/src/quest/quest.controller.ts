import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuestService } from './quest.service.js';
import { EventQuestService } from './event-quest.service.js';
import { WorldQuestService } from './world-quest.service.js';
import { CreateQuestDto } from './dto/create-quest.dto.js';
import { CompleteQuestDto } from './dto/complete-quest.dto.js';
import { QuestFilterDto } from './dto/quest-filter.dto.js';
import { QuestSearchDto } from './dto/quest-search.dto.js';
import { CreateEventQuestDto } from './dto/create-event-quest.dto.js';
import { EventCheckinDto } from './dto/event-checkin.dto.js';
import { RedeemQrDto } from './dto/redeem-qr.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { DAILY_QUEST_TEMPLATES } from './daily-templates.js';

@Controller('quests')
export class QuestController {
  constructor(
    private readonly questService: QuestService,
    private readonly eventQuestService: EventQuestService,
    private readonly worldQuestService: WorldQuestService,
  ) {}

  @Get()
  findAll(@Query() filter: QuestFilterDto) {
    return this.questService.findAll(filter);
  }

  @Get('daily')
  getDailyQuests() {
    return this.questService.getDailyQuests();
  }

  /**
   * The standard quest pool — every everyday template, offered as a
   * pre-selection when creating a quest so nobody has to invent "Bett machen"
   * from scratch. Static catalog data, so no auth and no user context.
   */
  @Get('pool')
  getQuestPool() {
    return DAILY_QUEST_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      difficulty: t.difficulty,
      emoji: t.emoji,
    }));
  }

  /**
   * Semantic quest search. Declared above `:id` — Nest matches routes in
   * declaration order and would otherwise read "search" as a quest id.
   */
  @Get('search')
  search(@Query() dto: QuestSearchDto) {
    return this.questService.search(dto);
  }

  @Get('my/active')
  @UseGuards(JwtAuthGuard)
  findMyActive(@Request() req: any) {
    return this.questService.findMyActive(req.user.userId);
  }

  @Get('my/completed')
  @UseGuards(JwtAuthGuard)
  findMyCompleted(@Request() req: any) {
    return this.questService.findMyCompleted(req.user.userId);
  }

  // --- Event quests (user-organized gatherings with coin escrow) ----------

  @Post('events')
  @UseGuards(JwtAuthGuard)
  async createEvent(@Request() req: any, @Body() dto: CreateEventQuestDto) {
    const doc = await this.eventQuestService.create(req.user.userId, dto);
    return this.questService.findOne(doc._id.toString());
  }

  @Post(':id/event/join')
  @UseGuards(JwtAuthGuard)
  joinEvent(@Param('id') id: string, @Request() req: any) {
    return this.eventQuestService.join(id, req.user.userId);
  }

  @Post(':id/event/checkin')
  @UseGuards(JwtAuthGuard)
  eventCheckin(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: EventCheckinDto,
  ) {
    return this.eventQuestService.checkin(
      id,
      req.user.userId,
      dto.lat,
      dto.lng,
    );
  }

  @Post(':id/event/claim')
  @UseGuards(JwtAuthGuard)
  claimEvent(@Param('id') id: string, @Request() req: any) {
    return this.eventQuestService.claim(id, req.user.userId);
  }

  @Post(':id/event/finalize')
  @UseGuards(JwtAuthGuard)
  finalizeEvent(@Param('id') id: string, @Request() req: any) {
    return this.eventQuestService.finalize(id, req.user.userId);
  }

  @Get(':id/event/participation')
  @UseGuards(JwtAuthGuard)
  eventParticipation(@Param('id') id: string, @Request() req: any) {
    return this.eventQuestService.getParticipationView(id, req.user.userId);
  }

  // --- World quests (firm-organized, QR-redeemed) --------------------------

  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  redeemQr(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RedeemQrDto,
  ) {
    return this.worldQuestService.redeem(id, req.user.userId, dto.code);
  }

  @Get(':id/redemption')
  @UseGuards(JwtAuthGuard)
  redemptionState(@Param('id') id: string, @Request() req: any) {
    return this.worldQuestService.getRedemptionState(id, req.user.userId);
  }

  @Get(':id/qr')
  @UseGuards(JwtAuthGuard)
  qrPayload(@Param('id') id: string, @Request() req: any) {
    return this.worldQuestService.getQrPayload(id, req.user.userId);
  }

  /** "Mehr davon" — quests closest in meaning to this one. */
  @Get(':id/similar')
  similar(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.questService.findSimilar(
      id,
      limit ? Math.min(Number(limit) || 5, 20) : 5,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questService.findOne(id);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Request() req: any, @Body() dto: CreateQuestDto) {
    return this.questService.create(dto, req.user?.userId ?? null);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('id') id: string, @Request() req: any) {
    return this.questService.acceptQuest(id, req.user.userId);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: CompleteQuestDto,
  ) {
    return this.questService.completeQuest(id, req.user.userId, dto);
  }

  @Post(':id/abandon')
  @UseGuards(JwtAuthGuard)
  abandon(@Param('id') id: string, @Request() req: any) {
    return this.questService.abandonQuest(id, req.user.userId);
  }
}
