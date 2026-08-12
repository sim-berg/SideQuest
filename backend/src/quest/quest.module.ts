import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestController } from './quest.controller.js';
import { SideQuestController } from './sidequest.controller.js';
import { QuestService } from './quest.service.js';
import { Quest, QuestSchema } from './schemas/quest.schema.js';
import {
  DailySideQuest,
  DailySideQuestSchema,
} from './schemas/daily-sidequest.schema.js';
import { GeoModule } from '../geo/geo.module.js';
import { PetModule } from '../pet/pet.module.js';
import { UserModule } from '../user/user.module.js';
import { AchievementModule } from '../achievement/achievement.module.js';
import { TreasureModule } from '../treasure/treasure.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quest.name, schema: QuestSchema },
      { name: DailySideQuest.name, schema: DailySideQuestSchema },
    ]),
    GeoModule,
    PetModule,
    UserModule,
    AchievementModule,
    TreasureModule,
  ],
  controllers: [QuestController, SideQuestController],
  providers: [QuestService],
})
export class QuestModule {}
