import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema.js';
import { Quest, QuestSchema } from '../quest/schemas/quest.schema.js';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { AchievementModule } from '../achievement/achievement.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Quest.name, schema: QuestSchema },
    ]),
    // Profiles show emblems, and pinning one is validated against what the
    // user actually earned.
    AchievementModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
