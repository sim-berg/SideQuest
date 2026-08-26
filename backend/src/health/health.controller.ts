import { Controller, Get } from '@nestjs/common';
import { QuestVectorService } from '../vector/quest-vector.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly questVector: QuestVectorService) {}

  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Index health: is Qdrant reachable, how many quests are in it, and how many
   * are still waiting to be embedded. `pendingQuests` settling back to 0 after
   * a deploy is the signal that the backfill finished.
   */
  @Get('vector')
  vector() {
    return this.questVector.stats();
  }
}
