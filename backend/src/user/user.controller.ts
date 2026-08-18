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
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CHARACTER_CLASSES } from './character-classes.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@Request() req) {
    return this.userService.findById(req.user.userId);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @Post('me/checkin')
  dailyCheckin(@Request() req) {
    return this.userService.dailyCheckin(req.user.userId);
  }

  @Get('me/activity')
  getActivity(@Request() req) {
    return this.userService.getActivity(req.user.userId);
  }

  /** The character classes a profile can pick from. */
  @Get('meta/character-classes')
  characterClasses() {
    return CHARACTER_CLASSES;
  }

  /** Find people by username or display name. */
  @Get('search')
  search(@Request() req, @Query('q') q: string) {
    return this.userService.search(q ?? '', req.user.userId);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
