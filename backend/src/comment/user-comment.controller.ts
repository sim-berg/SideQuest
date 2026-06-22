import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CommentService } from './comment.service.js';

@Controller('users/me/comments')
@UseGuards(JwtAuthGuard)
export class UserCommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  mine(@Request() req) {
    return this.commentService.listByUser(req.user.userId, 10);
  }
}
