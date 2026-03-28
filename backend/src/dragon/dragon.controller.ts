import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DragonService } from './dragon.service.js';
import { ChooseDragonDto } from './dto/choose-dragon.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('dragons')
@UseGuards(JwtAuthGuard)
export class DragonController {
  constructor(private readonly dragonService: DragonService) {}

  @Get('me')
  findMine(@Request() req: any) {
    return this.dragonService.findByUserId(req.user.userId);
  }

  @Post('choose')
  choose(@Request() req: any, @Body() dto: ChooseDragonDto) {
    return this.dragonService.chooseDragon(req.user.userId, dto.type);
  }
}
