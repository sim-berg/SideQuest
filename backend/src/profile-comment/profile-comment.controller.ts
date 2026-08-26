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
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ProfileCommentService } from './profile-comment.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

export class CreateProfileCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body: string;
}

// `wall`, not `comments` — /users/me/comments is already the user's own quest
// comments, and `me` would collide with a :userId path.
@Controller('users/:userId/wall')
export class ProfileCommentController {
  constructor(private readonly comments: ProfileCommentService) {}

  /** The wall is public — that's the point of a community guest book. */
  @Get()
  list(@Param('userId') userId: string) {
    return this.comments.list(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('userId') userId: string,
    @Request() req,
    @Body() dto: CreateProfileCommentDto,
  ) {
    return this.comments.create(userId, req.user.userId, dto.body);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  remove(@Param('commentId') commentId: string, @Request() req) {
    return this.comments.remove(commentId, req.user.userId);
  }
}
