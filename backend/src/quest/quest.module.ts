import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestController } from './quest.controller.js';
import { SideQuestController } from './sidequest.controller.js';
import { QuestService } from './quest.service.js';
import { EventQuestService } from './event-quest.service.js';
import { WorldQuestService } from './world-quest.service.js';
import { Quest, QuestSchema } from './schemas/quest.schema.js';
import {
  DailySideQuest,
  DailySideQuestSchema,
} from './schemas/daily-sidequest.schema.js';
import {
  EventParticipation,
  EventParticipationSchema,
} from './schemas/event-participation.schema.js';
import {
  QuestRedemption,
  QuestRedemptionSchema,
} from './schemas/quest-redemption.schema.js';
import { GeoModule } from '../geo/geo.module.js';
import { PetModule } from '../pet/pet.module.js';
import { UserModule } from '../user/user.module.js';
import { AchievementModule } from '../achievement/achievement.module.js';
import { TreasureModule } from '../treasure/treasure.module.js';
import { CoinModule } from '../coin/coin.module.js';
import { VectorModule } from '../vector/vector.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quest.name, schema: QuestSchema },
      { name: DailySideQuest.name, schema: DailySideQuestSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: QuestRedemption.name, schema: QuestRedemptionSchema },
    ]),
    GeoModule,
    PetModule,
    UserModule,
    AchievementModule,
    TreasureModule,
    CoinModule,
    VectorModule,
  ],
  controllers: [QuestController, SideQuestController],
  providers: [QuestService, EventQuestService, WorldQuestService],
  exports: [QuestService],
})
export class QuestModule {}
