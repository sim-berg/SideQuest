import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreasureController } from './treasure.controller.js';
import { TreasureService } from './treasure.service.js';
import { TreasureSpawnerService } from './treasure-spawner.service.js';
import {
  TreasureSpawn,
  TreasureSpawnSchema,
} from './schemas/treasure-spawn.schema.js';
import { UserItem, UserItemSchema } from './schemas/user-item.schema.js';
import { Quest, QuestSchema } from '../quest/schemas/quest.schema.js';
import {
  DailySideQuest,
  DailySideQuestSchema,
} from '../quest/schemas/daily-sidequest.schema.js';
import { GeoModule } from '../geo/geo.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreasureSpawn.name, schema: TreasureSpawnSchema },
      { name: UserItem.name, schema: UserItemSchema },
      // Quest models are used read-only to check recipe unlocks
      // (completed side quests) — no dependency on QuestModule itself.
      { name: Quest.name, schema: QuestSchema },
      { name: DailySideQuest.name, schema: DailySideQuestSchema },
    ]),
    GeoModule,
  ],
  controllers: [TreasureController],
  providers: [TreasureService, TreasureSpawnerService],
  exports: [TreasureService],
})
export class TreasureModule {}
