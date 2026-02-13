import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { QuestService } from './quest.service.js';
import { CreateQuestDto } from './dto/create-quest.dto.js';
import { QuestFilterDto } from './dto/quest-filter.dto.js';

@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get()
  findAll(@Query() filter: QuestFilterDto) {
    return this.questService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuestDto) {
    return this.questService.create(dto);
  }
}
