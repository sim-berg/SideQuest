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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(
    private readonly petService: PetService,
    private readonly chatService: PetChatService,
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
