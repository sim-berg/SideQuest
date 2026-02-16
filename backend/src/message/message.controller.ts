import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessageService } from './message.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * GET /api/messages/unread-count
   *
   * IMPORTANT: this route is defined BEFORE the :userId param routes so that
   * NestJS does not interpret "unread-count" as a userId value.
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.messageService.getUnreadCount(req.user.userId);
    return { count };
  }

  /**
   * GET /api/messages/conversations
   */
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messageService.getConversations(req.user.userId);
  }

  /**
   * GET /api/messages/:userId?before=<messageId>&limit=<n>
   */
  @Get(':userId')
  async getMessages(
    @Request() req,
    @Param('userId') userId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.messageService.getMessages(
      req.user.userId,
      userId,
      before,
      parsedLimit,
    );
  }

  /**
   * POST /api/messages/:userId
   */
  @Post(':userId')
  async sendMessage(
    @Request() req,
    @Param('userId') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.sendMessage(req.user.userId, userId, dto.body);
  }

  /**
   * PATCH /api/messages/:userId/read
   */
  @Patch(':userId/read')
  async markAsRead(@Request() req, @Param('userId') userId: string) {
    return this.messageService.markAsRead(req.user.userId, userId);
  }
}
