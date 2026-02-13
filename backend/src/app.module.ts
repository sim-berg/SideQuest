import { Module } from '@nestjs/common';
import { QuestModule } from './quest/quest.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [QuestModule],
  controllers: [HealthController],
})
export class AppModule {}
