import { Module } from '@nestjs/common';
import { QuestController } from './quest.controller.js';
import { QuestService } from './quest.service.js';
import { GeoModule } from '../geo/geo.module.js';

@Module({
  imports: [GeoModule],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
