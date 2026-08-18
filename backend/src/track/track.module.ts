import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementModule } from '../achievement/achievement.module.js';
import { CoinModule } from '../coin/coin.module.js';
import { PetModule } from '../pet/pet.module.js';
import { BonusService } from './bonus.service.js';
import { ProgressService } from './progress.service.js';
import { TrackController } from './track.controller.js';
import { TrackRewardService } from './track-reward.service.js';
import { TrackService } from './track.service.js';
import { TrackKind } from './enums/track.enums.js';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema.js';
import {
  ProgressEvent,
  ProgressEventSchema,
} from './schemas/progress-event.schema.js';
import {
  Challenge,
  ChallengeSchema,
  EventTrack,
  EventTrackSchema,
  StoryArc,
  StoryArcSchema,
  Track,
  TrackSchema,
} from './schemas/track.schema.js';

/**
 * The Track domain.
 *
 * Challenge, StoryArc and EventTrack are registered as Mongoose discriminators
 * of Track: one collection, one base schema, per-kind fields. That is the
 * inheritance the domain asks for — a track is a track no matter its kind, and
 * a query for "everything the user is running" never has to union three
 * collections.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Track.name,
        schema: TrackSchema,
        discriminators: [
          { name: TrackKind.CHALLENGE, schema: ChallengeSchema },
          { name: TrackKind.STORY_ARC, schema: StoryArcSchema },
          { name: TrackKind.EVENT, schema: EventTrackSchema },
        ],
      },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: ProgressEvent.name, schema: ProgressEventSchema },
    ]),
    PetModule,
    CoinModule,
    AchievementModule,
  ],
  controllers: [TrackController],
  providers: [TrackService, ProgressService, BonusService, TrackRewardService],
  exports: [TrackService, ProgressService],
})
export class TrackModule implements OnModuleInit {
  constructor(private readonly trackService: TrackService) {}

  /** Keep the database in sync with the code-defined catalog on every boot. */
  async onModuleInit(): Promise<void> {
    await this.trackService.seedCatalog();
  }
}

// Referenced so the discriminator classes are not tree-shaken away.
void Challenge;
void StoryArc;
void EventTrack;
