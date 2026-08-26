import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema.js';
import { Element } from './enums/element.enum.js';
import { PetStage } from './enums/pet-stage.enum.js';

/** Old dragon type → element of the migrated pet. */
const DRAGON_TYPE_ELEMENT: Record<string, Element> = {
  ember: Element.FEUER,
  tide: Element.WASSER,
  thorn: Element.NATUR,
  gloom: Element.SCHATTEN,
  spark: Element.BLITZ,
};

/** Old evolution stage → new pet stage. */
const DRAGON_STAGE_MAP: Record<string, PetStage> = {
  egg: PetStage.EGG,
  hatchling: PetStage.HATCHLING,
  whelp: PetStage.JUVENILE,
  drake: PetStage.ADULT,
  elder_dragon: PetStage.ANCIENT,
};

/**
 * One-shot migration of the legacy `dragons` collection into the pet
 * menagerie. Dragons become legendary Drache pets, keeping XP, stage and
 * streak. Idempotent: skips users who already own a migrated pet.
 */
@Injectable()
export class PetMigrationService implements OnModuleInit {
  private readonly logger = new Logger(PetMigrationService.name);

  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.migrateDragons();
    } catch (err) {
      this.logger.error('Dragon migration failed', err as Error);
    }
  }

  private async migrateDragons(): Promise<void> {
    const dragons = await this.connection
      .collection('dragons')
      .find({})
      .toArray();
    if (dragons.length === 0) return;

    let migrated = 0;
    for (const dragon of dragons) {
      const userId = dragon.userId as string;
      const exists = await this.petModel
        .findOne({ userId, obtainedFrom: 'migration' })
        .exec();
      if (exists) continue;

      const hasActive = await this.petModel
        .findOne({ userId, isActive: true })
        .exec();

      const stage =
        DRAGON_STAGE_MAP[dragon.evolutionStage] ?? PetStage.HATCHLING;
      await this.petModel.create({
        userId,
        species: 'drache',
        element: DRAGON_TYPE_ELEMENT[dragon.type] ?? Element.FEUER,
        name: dragon.name ?? undefined,
        xp: dragon.xp ?? 0,
        // An old still-in-egg dragon hatches immediately as a hatchling —
        // the new hatch flow only targets mystery eggs (species null).
        stage: stage === PetStage.EGG ? PetStage.HATCHLING : stage,
        isActive: !hasActive,
        obtainedFrom: 'migration',
        hatchedAt: dragon.createdAt ?? new Date(),
        currentStreak: dragon.currentStreak ?? 0,
        lastStreakDate: dragon.lastStreakDate ?? null,
        lastQuestCompletedAt: dragon.lastQuestCompletedAt ?? null,
        questsCompletedToday: dragon.questsCompletedToday ?? 0,
        lastQuestDate: dragon.lastQuestDate ?? null,
      });
      migrated++;
    }
    if (migrated > 0) {
      this.logger.log(`Migrated ${migrated} dragon(s) into the pet menagerie`);
    }
  }
}
