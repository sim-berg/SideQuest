import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AchievementService } from './achievement.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get('mine')
  mine(@Request() req: any) {
    return this.achievementService.getUserAchievements(req.user.userId);
  }

  @Get('catalog')
  catalog(@Request() req: any) {
    return this.achievementService.getCatalogForUser(req.user.userId);
  }
}
