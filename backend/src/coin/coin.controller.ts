import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { CoinService } from './coin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('coins')
@UseGuards(JwtAuthGuard)
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  /** Balance + currency metadata of the logged-in user. */
  @Get('me')
  getMyWallet(@Request() req: any) {
    return this.coinService.getWalletView(req.user.userId);
  }

  /** Recent ledger entries of the logged-in user. */
  @Get('me/history')
  getMyHistory(@Request() req: any, @Query('limit') limit?: string) {
    const parsed = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50;
    return this.coinService.getHistory(req.user.userId, parsed);
  }
}
