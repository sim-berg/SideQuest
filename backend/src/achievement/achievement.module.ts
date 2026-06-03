import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementController } from './achievement.controller.js';
import { AchievementService } from './achievement.service.js';
import { ReplicateService } from './replicate.service.js';
import {
  Achievement,
  AchievementSchema,
} from './schemas/achievement.schema.js';
import {
  UserAchievement,
  UserAchievementSchema,
} from './schemas/user-achievement.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
    ]),
  ],
  controllers: [AchievementController],
  providers: [AchievementService, ReplicateService],
  exports: [AchievementService],
})
export class AchievementModule {}
