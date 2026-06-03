import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestModule } from './quest/quest.module.js';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MessageModule } from './message/message.module.js';
import { DragonModule } from './dragon/dragon.module.js';
import { AchievementModule } from './achievement/achievement.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    DragonModule,
    AchievementModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
