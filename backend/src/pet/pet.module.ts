import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PetController } from './pet.controller.js';
import { ChainController } from './chain.controller.js';
import { PetService } from './pet.service.js';
import { PetMigrationService } from './pet-migration.service.js';
import { AnthropicService } from './anthropic.service.js';
import { SoulService } from './soul.service.js';
import { PetChatService } from './pet-chat.service.js';
import { PetQuestmasterService } from './pet-questmaster.service.js';
import { ChainService } from './chain.service.js';
import { Pet, PetSchema } from './schemas/pet.schema.js';
import { UserSoul, UserSoulSchema } from './schemas/user-soul.schema.js';
import { PetMessage, PetMessageSchema } from './schemas/pet-message.schema.js';
import {
  QuestChain,
  QuestChainSchema,
} from './schemas/quest-chain.schema.js';
import { GeoModule } from '../geo/geo.module.js';
import { Quest, QuestSchema } from '../quest/schemas/quest.schema.js';
import {
  DailySideQuest,
  DailySideQuestSchema,
} from '../quest/schemas/daily-sidequest.schema.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pet.name, schema: PetSchema },
      { name: UserSoul.name, schema: UserSoulSchema },
      { name: PetMessage.name, schema: PetMessageSchema },
      { name: QuestChain.name, schema: QuestChainSchema },
      // Quest models are read-only here: quest history personalizes the
      // element roll and the souls — no dependency on QuestModule itself.
      { name: Quest.name, schema: QuestSchema },
      { name: DailySideQuest.name, schema: DailySideQuestSchema },
    ]),
    UserModule,
    GeoModule,
  ],
  controllers: [PetController, ChainController],
  providers: [
    PetService,
    PetMigrationService,
    AnthropicService,
    SoulService,
    PetChatService,
    PetQuestmasterService,
    ChainService,
  ],
  exports: [PetService, SoulService, PetQuestmasterService],
})
export class PetModule {}
