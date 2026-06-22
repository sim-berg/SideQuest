import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

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

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
