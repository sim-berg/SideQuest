import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
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

  /** Another user's emblem shelf — the community can browse each other. */
  @Get('user/:userId')
  ofUser(@Param('userId') userId: string) {
    return this.achievementService.getUserAchievements(userId);
  }

  /** One emblem of another user, including when and where they earned it. */
  @Get('user/:userId/:key')
  async oneOfUser(@Param('userId') userId: string, @Param('key') key: string) {
    const emblem = await this.achievementService.getUserEmblem(userId, key);
    if (!emblem) {
      throw new NotFoundException(`Emblem ${key} not earned by ${userId}`);
    }
    return emblem;
  }
}
