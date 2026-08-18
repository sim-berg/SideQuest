import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service.js';
import { FriendRequestDto } from './dto/friend-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

/** Kumpane — SideQuest's word for confirmed friends. */
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendship: FriendshipService) {}

  @Get()
  list(@Request() req) {
    return this.friendship.listFriends(req.user.userId);
  }

  @Get('requests/incoming')
  incoming(@Request() req) {
    return this.friendship.listIncoming(req.user.userId);
  }

  @Get('requests/outgoing')
  outgoing(@Request() req) {
    return this.friendship.listOutgoing(req.user.userId);
  }

  /** Badge count for the hub menu. */
  @Get('requests/count')
  async count(@Request() req) {
    return {
      pending: await this.friendship.countPendingIncoming(req.user.userId),
    };
  }

  /** How many Kumpane someone has — a public profile stat. */
  @Get('count/:userId')
  async countOf(@Param('userId') userId: string) {
    return { friends: await this.friendship.countFriends(userId) };
  }

  @Get('status/:userId')
  status(@Request() req, @Param('userId') userId: string) {
    return this.friendship.relationTo(req.user.userId, userId);
  }

  @Post('request/:userId')
  request(
    @Request() req,
    @Param('userId') userId: string,
    @Body() dto: FriendRequestDto,
  ) {
    return this.friendship.request(req.user.userId, userId, dto.message ?? '');
  }

  @Post('requests/:id/accept')
  accept(@Request() req, @Param('id') id: string) {
    return this.friendship.accept(id, req.user.userId);
  }

  @Post('requests/:id/decline')
  decline(@Request() req, @Param('id') id: string) {
    return this.friendship.decline(id, req.user.userId);
  }

  /** Withdraw a sent request, or end a friendship. */
  @Delete(':userId')
  remove(@Request() req, @Param('userId') userId: string) {
    return this.friendship.remove(req.user.userId, userId);
  }
}
