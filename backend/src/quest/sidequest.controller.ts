import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuestService } from './quest.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

/**
 * Discovery endpoint for auto-spawned side quests + per-user daily side quests.
 * Accept / complete / abandon of map side quests reuse the regular quest
 * endpoints (they are Quest documents).
 */
@Controller('sidequests')
export class SideQuestController {
  constructor(private readonly questService: QuestService) {}

  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.questService.getNearbySideQuests(
      Number(lat),
      Number(lng),
      radius != null ? Number(radius) : undefined,
    );
  }

  @Get('daily')
  @UseGuards(JwtAuthGuard)
  daily(@Request() req: any) {
    return this.questService.getDailySideQuests(req.user.userId);
  }

  @Post('daily/:id/complete')
  @UseGuards(JwtAuthGuard)
  completeDaily(@Param('id') id: string, @Request() req: any) {
    return this.questService.completeDailySideQuest(req.user.userId, id);
  }
}
