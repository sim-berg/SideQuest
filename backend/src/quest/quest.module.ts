import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestController } from './quest.controller.js';
import { QuestService } from './quest.service.js';
import { Quest, QuestSchema } from './schemas/quest.schema.js';
import { GeoModule } from '../geo/geo.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quest.name, schema: QuestSchema }]),
    GeoModule,
  ],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
