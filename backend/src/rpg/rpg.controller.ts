import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { RpgService } from './rpg.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ZoneType } from './enums/zone-type.enum.js';

class GetQuestsQuery {
  @IsEnum(ZoneType)
  zone: ZoneType;
}

class CompleteQuestBody {
  @IsString()
  templateId: string;
}

@Controller('rpg')
@UseGuards(JwtAuthGuard)
export class RpgController {
  constructor(private readonly rpgService: RpgService) {}

  @Get('quests')
  getAvailable(@Request() req: any, @Query() query: GetQuestsQuery) {
    return this.rpgService.getAvailableQuests(req.user.userId, query.zone);
  }

  @Post('quests/complete')
  complete(@Request() req: any, @Body() body: CompleteQuestBody) {
    return this.rpgService.completeQuest(req.user.userId, body.templateId);
  }

  @Get('quests/mine')
  getMine(@Request() req: any) {
    return this.rpgService.getUserActiveQuests(req.user.userId);
  }
}
