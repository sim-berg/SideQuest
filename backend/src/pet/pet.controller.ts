import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PetService } from './pet.service.js';
import { PetChatService } from './pet-chat.service.js';
import { PetImageService } from './pet-image.service.js';
import { PetTradeService } from './pet-trade.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(
    private readonly petService: PetService,
    private readonly chatService: PetChatService,
    private readonly imageService: PetImageService,
    private readonly tradeService: PetTradeService,
  ) {}

  /** The user's menagerie; creates the starter egg on first call. */
  @Get('me')
  findMine(@Request() req: any) {
    return this.petService.findAllByUser(req.user.userId);
  }

  /** Chat history with the active companion. */
  @Get('chat')
  chatHistory(@Request() req: any) {
    return this.chatService.getHistory(req.user.userId);
  }

  /** Talk to the active companion (LLM persona from its soul.md). */
  @Post('chat')
  chat(@Request() req: any, @Body() body: { message: string }) {
    return this.chatService.chat(req.user.userId, body?.message ?? '');
  }

  // --- Trading ------------------------------------------------------------

  /** My open trade offers (incoming + outgoing). */
  @Get('trades')
  listTrades(@Request() req: any) {
    return this.tradeService.listMine(req.user.userId);
  }

  /** Offer one of my pets to another user for coins (price 0 = gift). */
  @Post('trades')
  createTrade(
    @Request() req: any,
    @Body() body: { petId: string; toUsername: string; price: number },
  ) {
    return this.tradeService.createOffer(
      req.user.userId,
      body?.petId ?? '',
      body?.toUsername ?? '',
      body?.price ?? 0,
    );
  }

  @Post('trades/:id/accept')
  acceptTrade(@Request() req: any, @Param('id') id: string) {
    return this.tradeService.accept(id, req.user.userId);
  }

  @Post('trades/:id/decline')
  declineTrade(@Request() req: any, @Param('id') id: string) {
    return this.tradeService.decline(id, req.user.userId);
  }

  @Post('trades/:id/cancel')
  cancelTrade(@Request() req: any, @Param('id') id: string) {
    return this.tradeService.cancel(id, req.user.userId);
  }

  // --- Per-pet actions ----------------------------------------------------

  /** Generated portrait for the pet's current evolution stage. */
  @Get(':id/image')
  image(@Param('id') id: string) {
    return this.imageService.getImage(id);
  }

  /** Replace the cached portrait with a freshly generated one (owner-only). */
  @Post(':id/image/regenerate')
  regenerateImage(@Request() req: any, @Param('id') id: string) {
    return this.imageService.regenerate(req.user.userId, id);
  }

  @Post(':id/equip')
  equip(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { itemId: string },
  ) {
    return this.petService.equip(req.user.userId, id, body?.itemId ?? '');
  }

  @Post(':id/unequip')
  unequip(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { itemId: string },
  ) {
    return this.petService.unequip(req.user.userId, id, body?.itemId ?? '');
  }

  @Post(':id/activate')
  activate(@Request() req: any, @Param('id') id: string) {
    return this.petService.setActive(req.user.userId, id);
  }

  @Post(':id/name')
  rename(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return this.petService.rename(req.user.userId, id, body?.name ?? '');
  }
}
