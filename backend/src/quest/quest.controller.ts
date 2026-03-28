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
import { CreateQuestDto } from './dto/create-quest.dto.js';
import { CompleteQuestDto } from './dto/complete-quest.dto.js';
import { QuestFilterDto } from './dto/quest-filter.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get()
  findAll(@Query() filter: QuestFilterDto) {
    return this.questService.findAll(filter);
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
    return this.questService.completeQuest(id, req.user.userId, dto.lat, dto.lng);
  }

  @Post(':id/abandon')
  @UseGuards(JwtAuthGuard)
  abandon(@Param('id') id: string, @Request() req: any) {
    return this.questService.abandonQuest(id, req.user.userId);
  }
}
