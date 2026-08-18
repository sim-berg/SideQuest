import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestModule } from './quest/quest.module.js';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MessageModule } from './message/message.module.js';
import { PetModule } from './pet/pet.module.js';
import { AchievementModule } from './achievement/achievement.module.js';
import { CommentModule } from './comment/comment.module.js';
import { TreasureModule } from './treasure/treasure.module.js';
import { CoinModule } from './coin/coin.module.js';
import { MediaModule } from './media/media.module.js';
import { FriendshipModule } from './friendship/friendship.module.js';
import { ProfileCommentModule } from './profile-comment/profile-comment.module.js';
import { TrackModule } from './track/track.module.js';
import { VectorModule } from './vector/vector.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MediaModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    QuestModule,
    UserModule,
    AuthModule,
    MessageModule,
    PetModule,
    AchievementModule,
    CommentModule,
    TreasureModule,
    CoinModule,
    FriendshipModule,
    ProfileCommentModule,
    TrackModule,
    VectorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
