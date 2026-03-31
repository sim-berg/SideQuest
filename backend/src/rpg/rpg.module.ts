import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRpgQuest, UserRpgQuestSchema } from './schemas/user-rpg-quest.schema.js';
import { RpgController } from './rpg.controller.js';
import { RpgService } from './rpg.service.js';
import { DragonModule } from '../dragon/dragon.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserRpgQuest.name, schema: UserRpgQuestSchema },
    ]),
    DragonModule,
  ],
  controllers: [RpgController],
  providers: [RpgService],
})
export class RpgModule {}
