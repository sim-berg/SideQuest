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
import { CreateEventQuestDto } from './dto/create-event-quest.dto.js';
import { EventCheckinDto } from './dto/event-checkin.dto.js';
import { RedeemQrDto } from './dto/redeem-qr.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuestDto) {
    return this.questService.create(dto);
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
