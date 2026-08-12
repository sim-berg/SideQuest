import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChainService } from './chain.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('pets/chains')
@UseGuards(JwtAuthGuard)
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  /** The current offered/active detective journey (null when none). */
  @Get('current')
  current(@Request() req: any) {
    return this.chainService.getCurrent(req.user.userId);
  }

  /** Ask the pet for a new journey around the given position. */
  @Post('offer')
  offer(@Request() req: any, @Body() body: { lat: number; lng: number }) {
    return this.chainService.offer(
      req.user.userId,
      Number(body?.lat),
      Number(body?.lng),
    );
  }

  @Post(':id/accept')
  accept(@Request() req: any, @Param('id') id: string) {
    return this.chainService.accept(req.user.userId, id);
  }

  @Post(':id/dismiss')
  async dismiss(@Request() req: any, @Param('id') id: string) {
    await this.chainService.dismiss(req.user.userId, id);
    return { ok: true };
  }

  @Post(':id/steps/:index/complete')
  completeStep(
    @Request() req: any,
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.chainService.completeStep(
      req.user.userId,
      id,
      Number(index),
      Number(body?.lat),
      Number(body?.lng),
    );
  }
}
