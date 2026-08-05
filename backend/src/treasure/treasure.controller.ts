import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TreasureService } from './treasure.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CollectTreasureDto } from './dto/collect-treasure.dto.js';
import { CraftDto } from './dto/craft.dto.js';

/**
 * Treasure hunting: discovery of worker-spawned chests (public, like the
 * side quest discovery), plus authenticated collect / inventory / crafting.
 */
@Controller('treasures')
export class TreasureController {
  constructor(private readonly treasureService: TreasureService) {}

  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.treasureService.getNearby(
      Number(lat),
      Number(lng),
      radius != null ? Number(radius) : undefined,
    );
  }

  @Get('catalog')
  catalog() {
    return this.treasureService.getCatalog();
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  inventory(@Request() req: any) {
    return this.treasureService.getInventory(req.user.userId);
  }

  @Get('recipes')
  @UseGuards(JwtAuthGuard)
  recipes(@Request() req: any) {
    return this.treasureService.getRecipes(req.user.userId);
  }

  @Post(':id/collect')
  @UseGuards(JwtAuthGuard)
  collect(
    @Param('id') id: string,
    @Body() dto: CollectTreasureDto,
    @Request() req: any,
  ) {
    return this.treasureService.collect(id, req.user.userId, dto.lat, dto.lng);
  }

  @Post('craft')
  @UseGuards(JwtAuthGuard)
  craft(@Body() dto: CraftDto, @Request() req: any) {
    return this.treasureService.craft(req.user.userId, dto.itemIds);
  }
}
